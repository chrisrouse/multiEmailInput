import { LightningElement, api, track } from 'lwc';

export default class MultiEmailInputCpe extends LightningElement {
    _inputVariables = [];
    @track _flowVariables = [];

    @api
    get inputVariables() {
        return this._inputVariables;
    }

    set inputVariables(variables) {
        this._inputVariables = variables || [];
    }

    @api
    get flowVariables() {
        return this._flowVariables;
    }

    set flowVariables(variables) {
        this._flowVariables = variables || [];
        this.initResourceOptions();
    }

    // Options for dropdowns
    _resourceOptions = [];
    _booleanOptions = [
        { label: 'True', value: 'true' },
        { label: 'False', value: 'false' }
    ];

    connectedCallback() {
        this.initResourceOptions();
    }

    initResourceOptions() {
        if (this._flowVariables && this._flowVariables.length) {
            const options = this._flowVariables
                .filter(variable => variable.name)
                .map(variable => ({
                    label: variable.name,
                    value: '{!' + variable.name + '}'
                }));
            
            // Add empty option
            options.unshift({ label: '-- None --', value: '' });
            
            this._resourceOptions = options;
        }
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
        return param && param.value || '';
    }

    get required() {
        const param = this.inputVariables.find(({ name }) => name === "required");
        return param && param.value ? 'true' : 'false';
    }

    get disabled() {
        const param = this.inputVariables.find(({ name }) => name === "disabled");
        return param && param.value ? 'true' : 'false';
    }

    get maxEmails() {
        const param = this.inputVariables.find(({ name }) => name === "maxEmails");
        return param && param.value !== undefined ? param.value : '';
    }

    get allowedDomains() {
        const param = this.inputVariables.find(({ name }) => name === "allowedDomains");
        return param && param.value || '';
    }

    get blockedDomains() {
        const param = this.inputVariables.find(({ name }) => name === "blockedDomains");
        return param && param.value || '';
    }

    get invalidEmailErrorMessage() {
        const param = this.inputVariables.find(({ name }) => name === "invalidEmailErrorMessage");
        return param && param.value || '';
    }

    get maxEmailsErrorMessage() {
        const param = this.inputVariables.find(({ name }) => name === "maxEmailsErrorMessage");
        return param && param.value || '';
    }

    get duplicateEmailErrorMessage() {
        const param = this.inputVariables.find(({ name }) => name === "duplicateEmailErrorMessage");
        return param && param.value || '';
    }

    get allowedDomainErrorMessage() {
        const param = this.inputVariables.find(({ name }) => name === "allowedDomainErrorMessage");
        return param && param.value || '';
    }

    get blockedDomainErrorMessage() {
        const param = this.inputVariables.find(({ name }) => name === "blockedDomainErrorMessage");
        return param && param.value || '';
    }

    get resourceOptions() {
        return this._resourceOptions;
    }
    
    get booleanOptions() {
        return this._booleanOptions;
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

    // Helper method to handle combobox changes
    processValueChange(event, propertyName, dataType = 'String') {
        let value = event.detail.value;
        
        // Handle boolean values
        if (dataType === 'Boolean') {
            value = value === 'true';
        }
        
        // Handle integer values
        if (dataType === 'Integer' && value) {
            // If it's a flow variable reference (starts with {!), keep as is
            if (!value.startsWith('{!')) {
                const parsedValue = parseInt(value, 10);
                value = isNaN(parsedValue) ? null : parsedValue;
            }
        }
        
        this.dispatchFlowValueChangeEvent(propertyName, value, dataType);
    }

    // Event handlers for each property
    handleLabelChange(event) {
        this.processValueChange(event, 'label');
    }

    handlePlaceholderChange(event) {
        this.processValueChange(event, 'placeholder');
    }

    handleHelpTextChange(event) {
        this.processValueChange(event, 'helpText');
    }

    handleRequiredChange(event) {
        this.processValueChange(event, 'required', 'Boolean');
    }

    handleDisabledChange(event) {
        this.processValueChange(event, 'disabled', 'Boolean');
    }

    handleMaxEmailsChange(event) {
        this.processValueChange(event, 'maxEmails', 'Integer');
    }

    handleAllowedDomainsChange(event) {
        this.processValueChange(event, 'allowedDomains');
    }

    handleBlockedDomainsChange(event) {
        this.processValueChange(event, 'blockedDomains');
    }

    handleInvalidEmailErrorMessageChange(event) {
        this.processValueChange(event, 'invalidEmailErrorMessage');
    }

    handleMaxEmailsErrorMessageChange(event) {
        this.processValueChange(event, 'maxEmailsErrorMessage');
    }

    handleDuplicateEmailErrorMessageChange(event) {
        this.processValueChange(event, 'duplicateEmailErrorMessage');
    }

    handleAllowedDomainErrorMessageChange(event) {
        this.processValueChange(event, 'allowedDomainErrorMessage');
    }

    handleBlockedDomainErrorMessageChange(event) {
        this.processValueChange(event, 'blockedDomainErrorMessage');
    }}