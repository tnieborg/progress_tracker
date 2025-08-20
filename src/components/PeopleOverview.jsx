import React from "react";
import List from "./List";

export default function PeopleOverview(props) {
  return <List title="Tracked People Projects" type="people" {...props} />;
}
