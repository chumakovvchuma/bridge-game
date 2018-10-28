import React from "react";
import {Redirect} from "react-router-dom";
import {dispatch, dispatchToDatabase} from "../reducer/reducer.js";
import Sidebar from "./sidebar/sidebar.js";
import {GAME_STATE} from "./constant.js";
import {DB} from "../firebase/db.js";
import randomColor from "randomcolor";
import {EMPTY_SEAT} from "./constant.js";
import TableModel from "../reducer/tableModel.js";
import Header from "./header.js";
import {Loading} from "./loading.js";
import {FloatBtn} from "./floatBtn.js";
import GameState from "./gameState.js";
import "../style/reset.scss";
import "../style/table.scss";
import "../style/game.scss";
import "../style/record-item.scss";
import "../style/record.scss";
import "../style/dot.scss";
import "../style/rewind.scss";
import "../style/sidebar.scss";

export default class Table extends React.Component {
  constructor(props) {
    super(props);
    this.linkId =
            this.props.match.params.id || window.location.hash.slice(8);

    this.childRef = React.createRef();

    this.state = {
      isLoad: false,
      canRedirect: false,
      isClosed: false,
      windowWidth: window.innerWidth,
      windowHeight: window.innerHeight,
      sidebarWidth: null
    };
    this.timer;

    this.addPlayerToTable = this.addPlayerToTable.bind(this);
    this.toggleChatroom = this.toggleChatroom.bind(this);
    this.handleResize = this.handleResize.bind(this);
    this.color = randomColor("dark");
  }
  handleResize() {
    setTimeout(() => {
      let width = 0;
      if (this.childRef.current) {
        width = this.childRef.current.offsetWidth;
      }
      if (this.props.isChatroomShown && window.innerWidth <= 700) {
        this.toggleChatroom();
      }
      this.setState({sidebarWidth: width});
    }, 0);

    this.setState({
      windowWidth: window.innerWidth,
      windowHeight: window.innerHeight
    });
  }
  componentWillUnmount() {
    window.removeEventListener("resize", this.handleResize);
  }
  componentDidMount() {
    // register database event and fetch table data
    this.model = new TableModel(this.linkId);
    let currentUser = this.props.currentUser;
    if (!this.props.currentUser) {
      DB.getCurrentUser();
    }
    this.model
      .get()
      .then(table => {
        this.id = table.id;
        this.setState({isLoad: true});
        window.addEventListener("resize", this.handleResize);
        this.handleResize();
        if (
          this.props.currentUser &&
                    !table.players.includes(currentUser.uid)
        ) {
          this.addPlayerToTable(table);
        }
      })
      .catch(error => console.log(error));
  }
  addPlayerToTable(table) {
    let {players, viewers} = table;
    let {currentUser} = this.props;

    let emptySeatIndex = players.findIndex(seat => seat === EMPTY_SEAT),
      canBePlayer =
                players.some(seat => seat === EMPTY_SEAT) &&
                players.every(seat => seat !== currentUser.uid),
      canBeViewer = Boolean(!viewers || !viewers[currentUser.uid]);

    if (canBePlayer) {
      dispatchToDatabase("ADD_PLAYER_TO_TABLE", {
        currentUser: currentUser,
        table: table,
        emptySeatIndex: emptySeatIndex,
        color: this.color
      });
    } else if (canBeViewer) {
      dispatchToDatabase("ADD_VIEWER_TO_TABLE", {
        currentUser: currentUser,
        table: table,
        color: this.color
      });
    }
  }
  toggleChatroom() {
    dispatch("TOGGLE_CHATROOM_PANEL", {
      isChatroomShown: !this.props.isChatroomShown
    });
    this.handleResize();
  }
  componentDidUpdate(prevProps) {
    let {tableList, tables, currentTableId} = this.props;
    if (!tableList) return;

    if (currentTableId !== prevProps.currentTableId) {
      this.setState({isLoad: false});
      this.model.get().then(data => this.setState({isLoad: true}));
    }

    let {id, linkId} = this;

    if (tableList[linkId] && tableList[linkId].id) {
      if (tables[id] !== prevProps.tables[id]) {
        this.addPlayerToTable(tables[id]);
      }
    }
  }
  render() {
    let {canRedirect, isLoad} = this.state;

    if (canRedirect) {
      return <Redirect to="/login" />;
    }

    if (!isLoad) {
      return <Loading />;
    }

    let {tables, currentUser, chatroom} = this.props;
    let {id} = this;

    if (!tables || !id) {
      return null;
    }

    let targetTable = tables[id];

    if (
      targetTable.gameState &&
            targetTable.gameState === GAME_STATE.close
    ) {
      return <Redirect to="/" />;
    }

    let chatroomToggleBtn = this.props.isHeaderPanelClosed &&
            !this.props.isChatroomShown && (
      <FloatBtn clickEvt={this.toggleChatroom} />
    );

    return (
      <div>
        <Header
          isHeaderPanelClosed={this.props.isHeaderPanelClosed}
          roomNum={this.linkId || null}
          isTableColor={true}
          getUserAuthInfo={this.props.getUserAuthInfo}
          currentUser={currentUser}
        />
        <div className="table">
          <GameState
            windowWidth={this.state.windowWidth}
            windowHeight={this.state.windowHeight}
            sidebarWidth={this.state.sidebarWidth}
            sidebarRef={this.childRef}
            isChatroomShown={this.props.isChatroomShown}
            currentUser={currentUser}
            currentTableId={this.props.currentTableId}
            table={targetTable}
          />
          <Sidebar
            setRef={this.childRef}
            toggleChatroom={this.toggleChatroom}
            isChatroomShown={this.props.isChatroomShown}
            currentUser={currentUser}
            chatroom={chatroom}
            table={targetTable}
          />
          {chatroomToggleBtn}
        </div>
      </div>
    );
  }
}
