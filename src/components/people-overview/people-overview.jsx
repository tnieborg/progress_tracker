import React from "react";
import List from "../list/list";

export default function PeopleOverview(props) {
  return <List title="Tracked People Projects" type="people" {...props} />;
}
