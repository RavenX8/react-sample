import React, {Component} from 'react';
import {connect} from "react-redux";
import {
    GridWithState as Grid,
    ITEM_CHANGE_ADD,
    ITEM_CHANGE_REMOVE,
    ITEM_CHANGE_UPDATE,
    TOOLBAR_DELETE_SELECTED,
    TOOLBAR_REFRESH
} from "../components/table/table";
import {ColumnMenu} from "../components/table/gird-column-menu";
import {MultiSelectCell} from "../components/table/multi-select-cell";
import {GridColumns} from "../components/table/grid-columns";
import {BuildHeader} from "../components/header-box";
import {getContactsList, getUserGroupsList} from "../selectors";
import {deleteUsers, getUsers, postUsers, putUsers} from "../actions";
import {getGroups} from "../actions/group-actions";

const mapDispatchToProps = dispatch => {
    return {
        getUsers: function () {
            return dispatch(getUsers())
        },
        postUsers: function (opts) {
            return dispatch(postUsers(opts))
        },
        putUsers: function (opts) {
            return dispatch(putUsers(opts))
        },
        deleteUsers: function (opts) {
            return dispatch(deleteUsers(opts))
        },
        getGroups: function () {
            return dispatch(getGroups())
        }
    };
};

const mapStateToProps = state => {
    return {
        contacts: getContactsList(state),
        groups: getUserGroupsList(state)
    };
};

export default connect(mapStateToProps, mapDispatchToProps)(class UserTable extends Component {
    editField = "inEdit";
    selectedField = "selected";
    GroupsCell = null;
    columns = [
        {title: '#', field: 'id', width: '75px', filter: 'numeric', editable: false, columnMenu: ColumnMenu},
        {title: 'Name', field: 'name', editor: 'text', required: true, columnMenu: ColumnMenu},
        {title: 'Username', field: 'username', required: true, columnMenu: ColumnMenu},
        {title: 'Email', field: 'email', required: true, columnMenu: ColumnMenu},
        {title: 'URL', field: 'website', columnMenu: ColumnMenu},
        {title: 'Groups', field: 'groups', required: true, cell: this.GroupsCell}
    ];
    GridColumns = GridColumns(this.columns, this.editField);
    state = {
        dataState: {take: 10, skip: 0},
        groups: [...this.props.groups]
    };

    componentDidMount() {
        this.props.getGroups()
            .then(res => {
                this.updateGroups();
            });
    }

    updateGroups() {
        this.GroupsCell = MultiSelectCell({options: this.props.groups});

        let columns = this.columns.map(item => {
            if (item.field === 'groups') {
                return {title: 'Groups', field: 'groups', cell: this.GroupsCell}
            }
            return item
        });
        this.GridColumns = GridColumns(columns, this.editField);
        this.setState({
            groups: [...this.props.groups]
        });
    }

    onToolbarClick = (event) => {
        switch (event.value) {
            case TOOLBAR_REFRESH: {
                this.props.getUsers()
                    .then(res => {
                        if (event.callback && typeof event.callback === 'function')
                            event.callback.call(undefined, res.data);
                    });
                break;
            }
            case TOOLBAR_DELETE_SELECTED: {
                this.props.deleteUsers(event.dataItem);
                break;
            }
            default:
                break;
        }
    };

    onDataChange = (event) => {
        switch (event.value) {
            case ITEM_CHANGE_ADD: {
                return this.props.postUsers(event.dataItem);
            }
            case ITEM_CHANGE_UPDATE: {
                return this.props.putUsers(event.dataItem);
            }
            case ITEM_CHANGE_REMOVE: {
                return this.props.deleteUsers(event.dataItem);
            }
            default:
                break;
        }
    };

    render() {
        const data = this.props.contacts;
        return (
            <>
                {BuildHeader('Users Table')}
                <div className={"usa-section"}>
                    <main className={"usa-layout-docs__main usa-prose usa-layout-docs"}
                          id={"main-content"}>
                        <div className={"usa-content overflow-x-auto overflow-y-auto"}>
                            <Grid className={"usa-table"}
                                  editable={true}
                                  sortable={true}
                                  pageable={true}
                                  pageSize={10}
                                  data={data}
                                  onClick={this.onToolbarClick}
                                  onChange={this.onDataChange}
                                  fetchData={this.props.getUsers}
                                  editField={this.editField}
                                  selectedField={this.selectedField}
                                  idField={'id'}
                                  columns={this.columns}
                            >
                                {this.GridColumns}
                            </Grid>
                        </div>
                    </main>
                </div>
            </>
        );
    }
});