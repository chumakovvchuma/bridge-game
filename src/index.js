import "./style/main.scss";
import React from "react";
import ReactDOM from "react-dom";
import Game from "./components/game.js";
import Login from "./components/login.js";
import CreateTable from "./components/createTable.js";
import Table from "./components/table.js";
import Header from "./components/header.js";
import Lobby from "./components/lobby.js";
import Loading from "./components/loading.js";
import SignUp from "./components/signUp.js";
import {app} from "./firebase/firebase.js";
import {
  IndexRoute,
  BrowserRouter,
  Router,
  Route,
  Switch,
  Redirect,
  Link,
  withrouter,
  HashRouter
} from "react-router-dom";
import {dispatch, store} from "./reducer/reducer.js";

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = store.getState();
    this.update = this.update.bind(this);
    this.stopLoading = this.stopLoading.bind(this);
    this.updateUserInfo = this.updateUserInfo.bind(this);
    this.getUserAuthInfo = this.getUserAuthInfo.bind(this);
    // this.updateCloseTable = this.updateCloseTable.bind(this);
  }
  update() {
    this.setState(store.getState());
  }
  componentDidUnMount() {
    this.unSubscribe();
  }
  componentDidMount() {
    this.unSubscribe = store.subscribe(this.update.bind(this));
    this.stopLoading();
  }
  updateUserInfo(user, userInfo) {
    dispatch("UPDATE_USER_INFO", {
      user: user,
      uid: user.uid,
      userInfo: userInfo
    });
  }
  getUserAuthInfo() {
    return new Promise((resolve, reject) => {
      app.auth.onAuthStateChanged(user => {
        if (user) {
          app.getDataByPathOnce(`users/${user.uid}`, snapshot => {
            let userInfo = snapshot.val();
            resolve(userInfo);
            dispatch("UPDATE_USER_INFO", {
              user: user,
              uid: user.uid,
              userInfo: snapshot.val()
            });
          });
        } else {
          reject(true);
          return dispatch("UPDATE_USER_INFO", {
            uid: null,
            userInfo: null,
            user: null
          });
        }
      });
    });
  }
  stopLoading() {
    dispatch("STOP_LOADING", {isLoad: true});
  }
  render() {
    console.log("in APP", this.state);
    let pathName = window.location.pathname;
    if (!this.state.isLoad) {
      return <Loading />;
    }
    let currentUser = this.state.user;
    return (
      <div>
        <HashRouter>
          <div>
            <Header
              getUserAuthInfo={this.getUserAuthInfo}
              userList={this.state.userList}
              isInTablePage={this.state.isInTablePage}
              updateUserInfo={this.updateUserInfo}
              isLogin={this.state.isLogin || false}
              path={pathName}
              userInfo={this.state.userInfo}
              uid={this.state.uid}
              currentUser={this.state.user}
            />
            <div>
              <Route
                path="/login"
                exact
                render={props => <Login />}
              />
              <Route
                exact
                path="/signup"
                render={props => (
                  <SignUp
                    updateUserInfo={this.updateUserInfo}
                    {...props}
                  />
                )}
              />
              <Route
                path="/table/:id"
                render={props => (
                  <Table
                    currentTableId={
                      this.state.currentTableId
                    }
                    getUserAuthInfo={this.getUserAuthInfo}
                    userInfo={this.state.userInfo}
                    chatroom={this.state.chatroom}
                    tables={this.state.tables}
                    tableList={this.state.tableList}
                    currentUser={this.state.user}
                    {...props}
                  />
                )}
              />
              <Route
                exact
                path="/"
                render={() => (
                  <Lobby
                    tables={this.state.tables || null}
                    currentUser={this.state.user}
                    tableList={this.state.tableList}
                  />
                )}
              />
            </div>
          </div>
        </HashRouter>
      </div>
    );
  }
}

ReactDOM.render(<App />, document.getElementById("main"));
