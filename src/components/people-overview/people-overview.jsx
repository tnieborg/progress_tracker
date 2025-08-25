import React from "react";
import List from "../list/list";
import AddPerson from "./add-person";
import "./people-overview.css";

export default function PeopleOverview({
        data,
        onAdd,
        onUpdate,
        onDelete,
        readOnly,
        canAdd = false,
        canDelete = false,
        ...rest
}) {
        return (
                <div className="people-overview">
                        <List
                                title="Tracked People Projects"
                                type="people"
                                data={data}
                                onUpdate={onUpdate}
                                onDelete={onDelete}
                                readOnly={readOnly}
                                canAdd={canAdd}
                                canDelete={canDelete}
                                {...rest}
                        >
                                {canAdd && !readOnly && (
                                        <AddPerson onAdd={onAdd} disabled={readOnly} />
                                )}
                        </List>
                </div>
        );
}
