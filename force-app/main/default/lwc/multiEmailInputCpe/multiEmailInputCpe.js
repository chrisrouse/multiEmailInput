import { LightningElement, api } from 'lwc';

export default class MultiEmailInputCpe extends LightningElement {
    _inputVariables = [];

    @api
    get inputVariables() {
        return this._inputVariables;
    }

    set inputVariables(variables) {
        this._inputVariables = variables || [];
    }

    // Property getters
    get label() {
        const param = this.inputVariables.find(({ name }) => name === "label");
        return (param && param.value) || 'Email';
    }

    get placeholder() {
        const param = this.inputVariables.find(({ name }) => name === "placeholder");
        return (param && param.value) || 'Enter an email address';
    }

    get helpText() {
        const param = this.inputVariables.find(({ name }) => name === "helpText");
        return param && param.value;
    }

    get required() {
        const param = this.inputVariables.find(({ name }) => name === "required");
        return param && param.value;
    }

    get disabled() {
        const param = this.inputVariables.find(({ name }) => name === "disabled");
        return param && param.value;
    }

    get maxEmails() {
        const param = this.inputVariables.find(({ name }) => name === "maxEmails");
        return param && param.value;
    }

    get allowedDomains() {
        const param = this.inputVariables.find(({ name }) => name === "allowedDomains");
        return param && param.value;
    }

    get blockedDomains() {
        const param = this.inputVariables.find(({ name }) => name === "blockedDomains");
        return param && param.value;
    }

    get invalidEmailErrorMessage() {
        const param = this.inputVariables.find(({ name }) => name === "invalidEmailErrorMessage");
        return param && param.value;
    }

    get maxEmailsErrorMessage() {
        const param = this.inputVariables.find(({ name }) => name === "maxEmailsErrorMessage");
        return param && param.value;
    }

    get duplicateEmailErrorMessage() {
        const param = this.inputVariables.find(({ name }) => name === "duplicateEmailErrorMessage");
        return param && param.value;
    }

    get allowedDomainErrorMessage() {
        const param = this.inputVariables.find(({ name }) => name === "allowedDomainErrorMessage");
        return param && param.value;
    }

    get blockedDomainErrorMessage() {
        const param = this.inputVariables.find(({ name }) => name === "blockedDomainErrorMessage");
        return param && param.value;
    }

    get allowedFormats() {
        return [
            'font',
            'size',
            'bold',
            'italic',
            'underline',
            'strike',
            'clean'
        ];
    }

    // Event dispatching methods
    dispatchFlowValueChangeEvent(name, newValue, dataType = 'String') {
        const valueChangeEvent = new CustomEvent(
            "configuration_editor_input_value_changed",
            {
                bubbles: true,
                cancelable: false,
                composed: true,
                detail: {
                    name,
                    newValue,
                    newValueDataType: dataType
                }
            }
        );
        this.dispatchEvent(valueChangeEvent);
    }

    // Event handlers for each property
    handleLabelChange(event) {
        this.dispatchFlowValueChangeEvent('label', event.target.value);
    }

    handlePlaceholderChange(event) {
        this.dispatchFlowValueChangeEvent('placeholder', event.target.value);
    }

    handleHelpTextChange(event) {
        this.dispatchFlowValueChangeEvent('helpText', event.target.value);
    }

    handleRequiredChange(event) {
        this.dispatchFlowValueChangeEvent('required', event.target.checked, 'Boolean');
    }

    handleDisabledChange(event) {
        this.dispatchFlowValueChangeEvent('disabled', event.target.checked, 'Boolean');
    }

    handleMaxEmailsChange(event) {
        const value = event.target.value ? parseInt(event.target.value, 10) : null;
        this.dispatchFlowValueChangeEvent('maxEmails', value, 'Integer');
    }

    handleAllowedDomainsChange(event) {
        this.dispatchFlowValueChangeEvent('allowedDomains', event.target.value);
    }

    handleBlockedDomainsChange(event) {
        this.dispatchFlowValueChangeEvent('blockedDomains', event.target.value);
    }

    handleInvalidEmailErrorMessageChange(event) {
        this.dispatchFlowValueChangeEvent('invalidEmailErrorMessage', event.detail.value);
    }

    handleMaxEmailsErrorMessageChange(event) {
        this.dispatchFlowValueChangeEvent('maxEmailsErrorMessage', event.detail.value);
    }

    handleDuplicateEmailErrorMessageChange(event) {
        this.dispatchFlowValueChangeEvent('duplicateEmailErrorMessage', event.detail.value);
    }

    handleAllowedDomainErrorMessageChange(event) {
        this.dispatchFlowValueChangeEvent('allowedDomainErrorMessage', event.detail.value);
    }

    handleBlockedDomainErrorMessageChange(event) {
        this.dispatchFlowValueChangeEvent('blockedDomainErrorMessage', event.detail.value);
    }

    // No preview modal functionality
}