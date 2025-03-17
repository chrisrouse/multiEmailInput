import { LightningElement, api, track } from 'lwc';
import { FlowAttributeChangeEvent } from 'lightning/flowSupport';

export default class MultiEmailInput2 extends LightningElement {
    @api label = 'Email';
    @api placeholder = 'Enter an email address';
    @api required = false;
    @api helpText;
    @api maxEmails;
    @api disabled = false;
    @api allowedDomains = '';
    @api validationErrorMessage = '';
    
    // Track internal state
    @track selectedEmails = [];
    @track inputValue = '';
    @track errorMessage = '';
    @track hasError = false;
    @track showHelpPopover = false;
    @track popoverPosition = 'bottom'; // Tracks if popover should appear above or below
    
    // Private properties
    _value = [];
    _emailCollection = [];
    
    // Define getters and setters for input property
    @api
    get value() {
        return this._value;
    }

    set value(value) {
        this._value = value;
        // Initialize the component with pre-set values
        if (Array.isArray(value) && value.length > 0 && this.selectedEmails.length === 0) {
            // Collect validation issues with the initial set
            const errors = [];
            
            // Check max emails constraint
            if (this.maxEmails && value.length > this.maxEmails) {
                errors.push(`You can only add up to ${this.maxEmails} email addresses`);
            }
            
            // Check domain validation if needed
            if (this.allowedDomains && this.allowedDomains.trim() !== '') {
                // Find any emails with invalid domains
                const invalidEmails = value.filter(email => !this.isValidDomain(email));
                if (invalidEmails.length > 0) {
                    if (this.validationErrorMessage && this.validationErrorMessage.trim() !== '') {
                        errors.push(this.validationErrorMessage);
                    } else {
                        errors.push('One or more emails has an invalid domain');
                    }
                }
            }
            
            // Set error state if needed
            if (errors.length > 0) {
                this.hasError = true;
                
                // Show combined error message if multiple issues
                if (errors.length === 1) {
                    this.errorMessage = errors[0];
                } else {
                    this.errorMessage = '<ul style="margin-left: 1rem; list-style-type: disc;">' + 
                        errors.map(err => `<li>${err}</li>`).join('') + 
                        '</ul>';
                }
            }
            
            // Always set the emails, but respect the maxEmails limit
            let emailsToSet = value;
            if (this.maxEmails && value.length > this.maxEmails) {
                emailsToSet = value.slice(0, this.maxEmails);
            }
            
            this.setEmails(emailsToSet);
        }
    }
    
    // Define getter and setter for output property
    @api
    get emailCollection() {
        return this._emailCollection;
    }
    
    set emailCollection(value) {
        this._emailCollection = value;
    }
         
    // Check if error message contains HTML tags (rich text)
    get isRichTextError() {
        return this.errorMessage && (
            this.errorMessage.includes('<') && 
            this.errorMessage.includes('>')
        );
    }
    
    // Handle key presses in the input field
    handleKeyDown(event) {
        // Don't process if disabled
        if (this.disabled) {
            event.preventDefault();
            return;
        }
        
        // Clear error state as soon as user starts typing
        if (this.hasError) {
            this.clearErrorState();
        }
        
        // Update inputValue each time a key is pressed
        this.inputValue = event.target.value;
        
        // Handle Enter key, Space key, and Tab key
        if (event.key === 'Enter' || event.key === ' ' || event.code === 'Space' || event.key === 'Tab') {
            // Get the current value directly from the input element
            const currentValue = event.target.value;
            
            // Only process if there's content to add
            if (currentValue && currentValue.trim()) {
                // For Enter and Space, prevent default behavior and stop propagation
                if (event.key === 'Enter' || event.key === ' ' || event.code === 'Space') {
                    event.preventDefault();
                    event.stopPropagation();
                }
                // For Tab, allow default behavior (for accessibility navigation)
                
                // Add the email
                this.validateAndAddEmail(currentValue);
            }
        }
    }
    
    // Handle input event to clear error state immediately on any input
    handleInput(event) {
        if (!this.disabled) {
            // Update inputValue
            this.inputValue = event.target.value;
            
            // Clear error state as soon as user starts typing
            if (this.hasError) {
                this.clearErrorState();
            }
        }
    }
    
    // Handle input change to update the tracked inputValue
    handleInputChange(event) {
        if (!this.disabled) {
            this.inputValue = event.target.value;
        }
    }
    
    // Helper to clear error state
    clearErrorState() {
        this.hasError = false;
        this.errorMessage = '';
    }
    
    // Handle when input field loses focus
    handleBlur(event) {
        if (this.disabled) return;
        
        // Add the email when input loses focus if there's text
        const currentValue = event.target.value;
        if (currentValue && currentValue.trim()) {
            this.validateAndAddEmail(currentValue);
        }
    }
    
    // Method to set error state with a message
    setError(message) {
        this.hasError = true;
        this.errorMessage = message;
    }
    
    // Method to validate and add emails
    validateAndAddEmail(emailValue) {
        const email = emailValue.trim();
        
        if (!email) return;
        
        // First validate basic email format
        if (!this.isValidEmail(email)) {
            this.setError('Please enter a valid email address');
            return;
        }
        
        // Then validate against allowed domains
        if (!this.isValidDomain(email)) {
            // Use custom validation error message if provided, otherwise use default
            if (this.validationErrorMessage && this.validationErrorMessage.trim() !== '') {
                this.setError(this.validationErrorMessage);
            } else {
                this.setError('Email domain is not allowed');
            }
            return;
        }
        
        // Check if we've reached maximum emails (if specified)
        if (this.maxEmails && this.selectedEmails.length >= this.maxEmails) {
            this.setError(`You can only add up to ${this.maxEmails} email addresses`);
            return;
        }
        
        // Check if email is already added
        if (this.selectedEmails.some(item => item.value.toLowerCase() === email.toLowerCase())) {
            this.setError('This email has already been added');
            return;
        }
        
        // If we get here, email is valid - add it to the collection
        const newEmail = {
            id: this.generateUniqueId(),
            value: email
        };
        this.selectedEmails = [...this.selectedEmails, newEmail];
        
        // Clear input and error state
        this.inputValue = '';
        this.template.querySelector('input').value = '';
        this.clearErrorState();
        
        // Dispatch change event
        this.dispatchValueChangedEvent();
    }
    
    // Add an email to the selected emails list - wrapper for backward compatibility
    addEmail() {
        if (this.disabled) return;
        
        // Get value directly from the input element
        const inputElement = this.template.querySelector('input');
        if (inputElement) {
            this.validateAndAddEmail(inputElement.value);
        }
    }
    
    // Handle custom pill remove button click
    handlePillRemove(event) {
        if (this.disabled) return;
        
        const idToRemove = event.currentTarget.dataset.id;
        this.selectedEmails = this.selectedEmails.filter(email => email.id !== idToRemove);
        this.dispatchValueChangedEvent();
        
        // Prevent event from bubbling up
        event.stopPropagation();
    }
    
    // Remove an email from the selected emails list (original method for backward compatibility)
    handleRemoveEmail(event) {
        if (this.disabled) return;
        
        const idToRemove = event.detail.name;
        this.selectedEmails = this.selectedEmails.filter(email => email.id !== idToRemove);
        this.dispatchValueChangedEvent();
    }
    
    // Validate email format using regex
    isValidEmail(email) {
        const emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return emailRegex.test(email);
    }
    
    // Validate email domain against allowed domains list
    isValidDomain(email) {
        // If no allowed domains specified, all domains are valid
        if (!this.allowedDomains || this.allowedDomains.trim() === '') {
            return true;
        }
        
        // Extract domain from email
        const domain = email.split('@')[1]?.toLowerCase();
        if (!domain) return false;
        
        // Split allowed domains by comma and trim each entry
        const allowedDomainsList = this.allowedDomains
            .split(',')
            .map(d => d.trim().toLowerCase())
            .filter(d => d !== '');
            
        // Check if the email domain is in the allowed list
        return allowedDomainsList.some(allowedDomain => domain === allowedDomain);
    }
    
    // Generate a unique ID for each email entry
    generateUniqueId() {
        return 'email-' + Math.random().toString(36).substring(2, 9);
    }
    
    // Dispatch custom event when emails change
    dispatchValueChangedEvent() {
        // Extract just the email values
        const emailValues = this.selectedEmails.map(email => email.value);
        
        // Update both internal collections
        this._value = emailValues; // Update input value (for completeness)
        this._emailCollection = emailValues; // Update output collection
        
        // Dispatch Flow attribute change event for the output collection
        this.dispatchEvent(new FlowAttributeChangeEvent('emailCollection', emailValues));
        
        // Also dispatch a regular event for non-Flow usages
        this.dispatchEvent(new CustomEvent('emailschanged', {
            detail: {
                emails: emailValues
            }
        }));
    }
    
    // Public method to clear all emails
    @api
    clearEmails() {
        if (this.disabled) return;
        
        this.selectedEmails = [];
        this.inputValue = '';
        const inputElement = this.template.querySelector('input');
        if (inputElement) {
            inputElement.value = '';
        }
        this.clearErrorState();
        this.dispatchValueChangedEvent();
    }

    // Public method to set emails programmatically
    @api
    setEmails(emailArray) {
        if (!Array.isArray(emailArray)) return;
        
        this.selectedEmails = emailArray.map(email => {
            return {
                id: this.generateUniqueId(),
                value: email
            };
        });
        
        // Make sure to update the Flow variable
        this.dispatchValueChangedEvent();
    }

    // Standard DOM validation method - required for Flow to validate properly
    @api
    checkValidity() {
        // Collect all validation errors
        const errors = this.collectValidationErrors();
        
        // The field is valid if there are no errors
        return errors.length === 0;
    }

    // Helper method to format error messages as rich text when needed
    formatErrorMessages(errors) {
        if (errors.length === 0) {
            return '';
        } else if (errors.length === 1) {
            return errors[0];
        } else {
            return '<ul style="margin-left: 1rem; list-style-type: disc;">' + 
                errors.map(err => `<li>${err}</li>`).join('') + 
                '</ul>';
        }
    }
    
    // Helper method to collect all validation errors
    collectValidationErrors() {
        const errors = [];
        
        // Check if required field has values
        if (this.required && this.selectedEmails.length === 0) {
            errors.push('Please enter at least one email address');
        }
        
        // Check if we're exceeding max emails
        if (this.maxEmails && this.selectedEmails.length > this.maxEmails) {
            errors.push(`You can only add up to ${this.maxEmails} email addresses`);
        }
        
        // Check domain validation if needed
        if (this.allowedDomains && this.allowedDomains.trim() !== '' && this.selectedEmails.length > 0) {
            // Check if all emails pass the domain validation
            const invalidEmail = this.selectedEmails.find(emailObj => {
                return !this.isValidDomain(emailObj.value);
            });
            
            if (invalidEmail) {
                if (this.validationErrorMessage && this.validationErrorMessage.trim() !== '') {
                    errors.push(this.validationErrorMessage);
                } else {
                    errors.push('One or more emails has an invalid domain');
                }
            }
        }
        
        return errors;
    }

    // Standard DOM validation method - required for Flow to validate properly
    @api
    reportValidity() {
        // Collect all validation errors
        const errors = this.collectValidationErrors();
        
        // Set error state based on validation results
        if (errors.length > 0) {
            this.hasError = true;
            this.errorMessage = this.formatErrorMessages(errors);
            return false;
        } else {
            this.clearErrorState();
            return true;
        }
    }
    
    // Keep the original validate method for backward compatibility
    @api
    validate() {
        // Perform full validation using reportValidity
        const isValid = this.reportValidity();
        
        if (isValid) {
            return { isValid: true };
        } else {
            return { 
                isValid: false,
                errorMessage: this.errorMessage
            };
        }
    }

    // Toggle help popover visibility
    toggleHelpPopover(event) {
        // Prevent event from bubbling up
        event.preventDefault();
        event.stopPropagation();
        
        // Toggle popover state
        this.showHelpPopover = !this.showHelpPopover;
        
        // If opening the popover, determine position and add document click listener
        if (this.showHelpPopover) {
            // Calculate if we need to show popover above or below based on viewport position
            this.determinePopoverPosition();
            
            // Use setTimeout to avoid the current click event from immediately closing the popover
            setTimeout(() => {
                document.addEventListener('click', this.handleDocumentClick);
                
                // Focus the close button for keyboard accessibility
                const closeButton = this.template.querySelector('.slds-popover__close');
                if (closeButton) {
                    closeButton.focus();
                }
                
                // Add keydown listener for Escape key to close the popover
                document.addEventListener('keydown', this.handleEscapeKey);
            }, 10);
        } else {
            // If closing, remove the listeners
            this.removeDocumentClickListener();
            document.removeEventListener('keydown', this.handleEscapeKey);
        }
    }
    
    // Determine if popover should appear above or below based on viewport position
    determinePopoverPosition() {
        const helpButton = this.template.querySelector('.slds-button_icon');
        if (helpButton) {
            const rect = helpButton.getBoundingClientRect();
            const spaceAbove = rect.top;
            const viewportHeight = window.innerHeight;
            const spaceBelow = viewportHeight - rect.bottom;
            
            // If there's less space above than below, show popover below
            this.popoverPosition = spaceAbove < spaceBelow ? 'bottom' : 'top';

            // Update the popover styles based on position
            setTimeout(() => {
                const popoverElement = this.template.querySelector('.slds-popover');
                if (popoverElement) {
                    if (this.popoverPosition === 'bottom') {
                        popoverElement.style.top = 'calc(100% + 8px)';
                        popoverElement.style.bottom = 'auto';
                    } else {
                        popoverElement.style.top = 'auto';
                        popoverElement.style.bottom = 'calc(100% + 8px)';
                    }
                }
            }, 0);
        }
    }

    // Get the appropriate popover class based on position
    get popoverClass() {
        return this.popoverPosition === 'bottom' 
            ? 'slds-popover slds-nubbin_top-left' 
            : 'slds-popover slds-nubbin_bottom-left';
    }
    
    // Close help popover
    closeHelpPopover(event) {
        // Prevent event from bubbling up
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }
        
        // Close the popover
        this.showHelpPopover = false;
        
        // Remove document click listener
        this.removeDocumentClickListener();
        
        // Return focus to the help button for keyboard accessibility
        const helpButton = this.template.querySelector('.slds-button_icon');
        if (helpButton) {
            helpButton.focus();
        }
    }

    // Stop event propagation to prevent closing when clicking inside the popover
    stopPropagation(event) {
        event.stopPropagation();
    }
    
    // Handle document click to close popover when clicking outside
    handleDocumentClick = (event) => {
        // Get references to popover and button elements
        const popoverElement = this.template.querySelector('.slds-popover');
        const helpButton = this.template.querySelector('.slds-button_icon');
        
        // Check if click is outside both the popover and help button
        if (popoverElement && helpButton && 
            !popoverElement.contains(event.target) && 
            !helpButton.contains(event.target)) {
            
            // Close the popover
            this.closeHelpPopover();
        }
    }
    
    // Handle Escape key for accessibility
    handleEscapeKey = (event) => {
        // If Escape key is pressed and the popover is open, close it
        if (event.key === 'Escape' && this.showHelpPopover) {
            this.closeHelpPopover();
        }
    }

    // Helper to remove document click listener
    removeDocumentClickListener() {
        document.removeEventListener('click', this.handleDocumentClick);
        document.removeEventListener('keydown', this.handleEscapeKey);
    }

    // Clean up event listeners when component is removed
    disconnectedCallback() {
        this.removeDocumentClickListener();
    }
}