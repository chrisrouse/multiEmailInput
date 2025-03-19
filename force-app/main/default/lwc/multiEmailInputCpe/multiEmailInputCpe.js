import { LightningElement, api, track } from 'lwc';

export default class MultiEmailInputCpe extends LightningElement {
    _inputVariables = [];
    @track _flowContext;
    @track _flowVariables = [];
    @track activeSections = ['errorMessages']; // Initialize with the section open
    
    // Resource picker state
    @track showRequiredDropdown = false;
    @track resourceFilter = '';
    @track activeField = null;

    @api
    get inputVariables() {
        return this._inputVariables;
    }

    set inputVariables(variables) {
        this._inputVariables = variables || [];
    }

    @api
    get flowContext() {
        return this._flowContext;
    }

    set flowContext(value) {
        this._flowContext = value;
    }

    @api
    get flowVariables() {
        return this._flowVariables;
    }

    set flowVariables(variables) {
        this._flowVariables = variables || [];
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
        return param && param.value;
    }

    get disabled() {
        const param = this.inputVariables.find(({ name }) => name === "disabled");
        return param && param.value;
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
    
    // Resource picker getters
    get requiredDisplay() {
        const param = this.inputVariables.find(({ name }) => name === "required");
        const value = param && param.value !== undefined ? param.value : false;
        
        // If it's a reference, return the string value
        if (typeof value === 'string' && value.startsWith('{!')) {
            return value;
        }
        
        // Otherwise return the boolean value as a string
        return String(value);
    }
    
    get requiredDropdownStyle() {
        return this.showRequiredDropdown ? 'display: block;' : 'display: none;';
    }
    
    // Get available Boolean resources from the flow
    get filteredBooleanResources() {
        if (!this._flowVariables) return [];
        
        const searchTerm = this.resourceFilter.toLowerCase();
        
        // Filter flow variables that are Boolean type or formulas
        return this._flowVariables
            .filter(variable => {
                // Include Boolean variables and formulas
                const isBoolean = variable.dataType === 'Boolean';
                const isFormula = variable.dataType === 'Formula';
                const matchesSearch = !searchTerm || 
                    variable.name.toLowerCase().includes(searchTerm);
                
                return (isBoolean || isFormula) && matchesSearch;
            })
            .map(variable => {
                // Transform to the format needed for display
                let icon = 'utility:variable';
                if (variable.dataType === 'Boolean') {
                    icon = 'utility:check';
                } else if (variable.dataType === 'Formula') {
                    icon = 'utility:formula';
                }
                
                return {
                    label: variable.name,
                    value: '{!' + variable.name + '}', // Flow syntax for variable reference
                    type: variable.dataType,
                    icon: icon
                };
            });
    }
    
    // Resource picker event handlers
    handleResourcePickerClick(event) {
        const field = event.target.dataset.field;
        this.activeField = field;
        this.resourceFilter = '';
        
        if (field === 'required') {
            this.showRequiredDropdown = true;
        }
        
        // Add event listener to close dropdown when clicking outside
        setTimeout(() => {
            window.addEventListener('click', this.handleClickOutside);
        }, 1);
    }
    
    handleResourceInputChange(event) {
        const field = event.target.dataset.field;
        if (field === this.activeField) {
            this.resourceFilter = event.target.value;
            
            // If it's an exact value (true/false) or a reference ({!...}), update immediately
            const value = event.target.value;
            if (value === 'true' || value === 'false' || (value.startsWith('{!') && value.endsWith('}'))) {
                this.updateFieldValue(field, value);
            }
        }
    }
    
    handleResourceSelect(event) {
        event.stopPropagation();
        
        const value = event.currentTarget.dataset.value;
        const field = event.currentTarget.dataset.field;
        
        this.updateFieldValue(field, value);
        this.closeAllDropdowns();
    }
    
    updateFieldValue(fieldName, value) {
        let dataType = 'String';
        
        // Determine the data type
        if (fieldName === 'required' || fieldName === 'disabled') {
            dataType = 'Boolean';
        } else if (fieldName === 'maxEmails') {
            dataType = 'Integer';
        }
        
        // Convert the value if it's not a reference
        if (dataType === 'Boolean' && (value === 'true' || value === 'false') && !value.includes('{!')) {
            value = value === 'true';
        } 
        else if (dataType === 'Integer' && !value.includes('{!') && !isNaN(parseInt(value, 10))) {
            value = parseInt(value, 10);
        }
        
        this.dispatchFlowValueChangeEvent(fieldName, value, dataType);
    }
    
    handleResourcePickerBlur() {
        // Use setTimeout to allow click events to process first
        setTimeout(() => {
            this.closeAllDropdowns();
        }, 300);
    }
    
    closeAllDropdowns() {
        this.showRequiredDropdown = false;
        window.removeEventListener('click', this.handleClickOutside);
    }
    
    // Attached as property to ensure proper 'this' binding
    handleClickOutside = (event) => {
        const dropdowns = this.template.querySelectorAll('.slds-dropdown');
        let clickedInside = false;
        
        dropdowns.forEach(dropdown => {
            if (dropdown.contains(event.target)) {
                clickedInside = true;
            }
        });
        
        // Also check if clicked on the input field
        const inputs = this.template.querySelectorAll('.slds-combobox__input');
        inputs.forEach(input => {
            if (input.contains(event.target)) {
                clickedInside = true;
            }
        });
        
        if (!clickedInside) {
            this.closeAllDropdowns();
        }
    }

    // Handlers for other fields
    handleLabelChange(event) {
        const value = event.target.value;
        this.dispatchFlowValueChangeEvent('label', value);
    }

    handlePlaceholderChange(event) {
        const value = event.target.value;
        this.dispatchFlowValueChangeEvent('placeholder', value);
    }

    handleHelpTextChange(event) {
        const value = event.target.value;
        this.dispatchFlowValueChangeEvent('helpText', value);
    }

    handleDisabledChange(event) {
        const value = event.target.checked;
        this.dispatchFlowValueChangeEvent('disabled', value, 'Boolean');
    }

    handleMaxEmailsChange(event) {
        let value = event.target.value;
        
        // If it's a valid number, convert to integer
        if (value && !isNaN(parseInt(value, 10))) {
            value = parseInt(value, 10);
        }
        
        this.dispatchFlowValueChangeEvent('maxEmails', value, 'Integer');
    }

    handleAllowedDomainsChange(event) {
        const value = event.target.value;
        this.dispatchFlowValueChangeEvent('allowedDomains', value);
    }

    handleBlockedDomainsChange(event) {
        const value = event.target.value;
        this.dispatchFlowValueChangeEvent('blockedDomains', value);
    }

    handleInvalidEmailErrorMessageChange(event) {
        const value = event.detail.value;
        this.dispatchFlowValueChangeEvent('invalidEmailErrorMessage', value);
    }

    handleMaxEmailsErrorMessageChange(event) {
        const value = event.detail.value;
        this.dispatchFlowValueChangeEvent('maxEmailsErrorMessage', value);
    }

    handleDuplicateEmailErrorMessageChange(event) {
        const value = event.detail.value;
        this.dispatchFlowValueChangeEvent('duplicateEmailErrorMessage', value);
    }

    handleAllowedDomainErrorMessageChange(event) {
        const value = event.detail.value;
        this.dispatchFlowValueChangeEvent('allowedDomainErrorMessage', value);
    }

    handleBlockedDomainErrorMessageChange(event) {
        const value = event.detail.value;
        this.dispatchFlowValueChangeEvent('blockedDomainErrorMessage', value);
    }

    // Event dispatching method
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

    // Handle accordion section toggle
    handleSectionToggle(event) {
        this.activeSections = event.detail.openSections;
    }
}