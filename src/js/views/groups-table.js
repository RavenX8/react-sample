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
import {GridColumns} from "../components/table/grid-columns";
import {getUserGroupsList} from "../selectors";
import {BuildHeader} from "../components/header-box";
import {deleteGroups, getGroups, postGroups, putGroups} from "../actions/group-actions";

const mapDispatchToProps = dispatch => {
    return {
        getGroups: function () {
            return dispatch(getGroups())
        },
        postGroups: function (opts) {
            return dispatch(postGroups(opts))
        },
        putGroups: function (opts) {
            return dispatch(putGroups(opts))
        },
        deleteGroups: function (opts) {
            return dispatch(deleteGroups(opts))
        }
    };
};

const mapStateToProps = state => {
    return {
        groups: getUserGroupsList(state)
    };
};

export default connect(mapStateToProps, mapDispatchToProps)(class GroupsTable extends Component {
    editField = "inEdit";
    selectedField = "selected";
    columns = [
        {title: '#', field: 'value', width: '75px', filter: 'numeric', editable: false, columnMenu: ColumnMenu},
        {title: 'Name', field: 'name', editor: 'text', required: true, columnMenu: ColumnMenu}
    ];
    GridColumns = GridColumns(this.columns, this.editField);
    state = {
        dataState: {take: 10, skip: 0},
        groups: [...this.props.groups]
    };

    onToolbarClick = (event) => {
        switch (event.value) {
            case TOOLBAR_REFRESH: {
                this.props.getGroups()
                    .then(res => {
                        if (event.callback && typeof event.callback === 'function')
                            event.callback.call(undefined, res.data);
                    });
                break;
            }
            case TOOLBAR_DELETE_SELECTED: {
                this.props.deleteGroups(event.dataItem);
                break;
            }
            default:
                break;
        }
    };

    onDataChange = (event) => {
        switch (event.value) {
            case ITEM_CHANGE_ADD: {
                return this.props.postGroups(event.dataItem);
            }
            case ITEM_CHANGE_UPDATE: {
                return this.props.putGroups(event.dataItem);
            }
            case ITEM_CHANGE_REMOVE: {
                return this.props.deleteGroups(event.dataItem);
            }
            default:
                break;
        }
    };

    render() {
        const data = this.props.groups;
        return (
            <>
                {BuildHeader('Groups Table', '/groups')}
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
                                  fetchData={this.props.getGroups}
                                  editField={this.editField}
                                  selectedField={this.selectedField}
                                  idField={'value'}
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