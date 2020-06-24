import { useEffect } from "react";
import Router from "next/router";

import { useStoreActions } from "../store";
import { NextPage } from "next";
import cookie from "js-cookie";
import { TokenPayload } from "../types";
import decode from "jwt-decode";


interface Props {
  token?: string;
}

const FinishOidcLoginPage: NextPage<Props> = ({ token }) => {

const addAuth = useStoreActions(s => s.auth.add);

useEffect(() => {
  if (token) {
    cookie.set("token", token, { expires: 7 });
    const decoded: TokenPayload = decode(token);
    addAuth(decoded);
    Router.push("/");
  }
}, []);
  return (
    null
  );
};

FinishOidcLoginPage.getInitialProps = ({ query }) => {
    return Promise.resolve(query);
};

export default FinishOidcLoginPage;
