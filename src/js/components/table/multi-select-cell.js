import React, {Component} from 'react';
import {MultiSelect} from '@progress/kendo-react-dropdowns';

export function MultiSelectCell({options, textField = 'name', dataField = 'id'}) {
    return class extends Component {
        options = [];
        textField = 'name';
        dataField = 'id';

        constructor(props) {
            super(props);
            this.options = options.concat(this.options);
            this.textField = textField;
            this.dataField = dataField;
        }

        handleChange = (e) => {
            this.props.onChange({
                dataItem: this.props.dataItem,
                field: this.props.field,
                syntheticEvent: e.syntheticEvent,
                value: e.target.value.map(item => item[e.target.props.dataItemKey])
            });
        };

        render() {
            const {dataItem, field} = this.props;
            const dataValue = dataItem[field] == null ? '' : dataItem[field];
            const selectableOptions = this.options;

            return (
                <td>
                    <MultiSelect
                        style={{width: "100%"}}
                        onChange={this.handleChange}
                        disabled={!dataItem.inEdit}
                        data={selectableOptions}
                        data-testid={"multi-select"}
                        value={selectableOptions.filter(option => {
                            for (let value of dataValue) {
                                if (option[this.dataField] === value)
                                    return true;
                            }
                            return false;
                        })}
                        textField={this.textField}
                        dataItemKey={this.dataField}
                    />
                </td>
            );
        }
    }
}