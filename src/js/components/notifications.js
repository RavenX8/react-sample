import React from "react";
import {Fade} from "@progress/kendo-react-animation";
import {Notification, NotificationGroup} from "@progress/kendo-react-notification";

export function Notify(notifications, onClose) {
    return (<div>
        {(notifications.length > 0) && <NotificationGroup
            style={{
                right: 0,
                bottom: 0,
                alignItems: 'flex-start',
                flexWrap: 'wrap-reverse'
            }}
        >

            {Object.keys(notifications).map((index) => {
                let type = notifications[index].type;
                let text = notifications[index].text;
                return (
                    <Fade enter={true} exit={true}>
                        <Notification
                            type={{style: type, icon: true}}
                            closable={true}
                            onClose={() => {
                                if (onClose && typeof onClose === 'function')
                                    onClose(notifications[index]);
                            }}
                        >
                            <span>{text}</span>
                        </Notification>
                    </Fade>);
            })}
        </NotificationGroup>
        }
    </div>);
}