import { LightningElement, api, track } from 'lwc';
import { FlowAttributeChangeEvent } from 'lightning/flowSupport';

export default class MultiEmailInput extends LightningElement {
    @api label = 'Email';
    @api placeholder = 'Enter an email address';
    @api required = false;
    @api helpText;
    @api maxEmails;
    @api disabled = false;
    @api allowedDomains = '';
    @api blockedDomains = '';
    @api allowedDomainsErrorMessage = '';
    @api blockedDomainsErrorMessage = '';
    @api invalidEmailErrorMessage = '';
    @api maxEmailsErrorMessage = '';
    @api duplicateEmailErrorMessage = '';
    
    // Track internal state
    @track selectedEmails = [];
    @track inputValue = '';
    @track errorMessage = '';
    @track hasError = false;
    @track showHelpPopover = false;
    @track popoverPosition = 'bottom'; // Tracks if popover should appear above or below
    
    // Constants
    ABSOLUTE_MAX_EMAILS = 150;
    
    // Private properties
    _value = [];
    _emailCollection = [];
    
    // Get dynamic class for pill container
    get pillContainerClass() {
        return this.selectedEmails.length > 0 
            ? 'slds-pill_container has-pills' 
            : 'slds-pill_container';
    }
    
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
            const effectiveMaxEmails = this.getEffectiveMaxEmails();
            if (value.length > effectiveMaxEmails) {
                errors.push(`You can only add up to ${effectiveMaxEmails} email addresses`);
            }
            
            // Check domain validation if needed
            const validationNeeded = (this.allowedDomains && this.allowedDomains.trim() !== '') || 
                                     (this.blockedDomains && this.blockedDomains.trim() !== '');
            
            if (validationNeeded) {
                // Find any emails with invalid domains
                const invalidEmails = value.filter(email => {
                    const result = this.isDomainValid(email);
                    return !result.isValid;
                });
                
                if (invalidEmails.length > 0) {
                    // Get the specific validation message for the first invalid email
                    if (invalidEmails.length === 1) {
                        const validationResult = this.isDomainValid(invalidEmails[0]);
                        if (validationResult.message) {
                            errors.push(validationResult.message);
                        } else {
                            errors.push('Email domain is not allowed.');
                        }
                    } else {
                        errors.push('One or more emails has an invalid domain.');
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
            if (value.length > effectiveMaxEmails) {
                emailsToSet = value.slice(0, effectiveMaxEmails);
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

    // Define getter for emailList property (comma-delimited string)
    @api
    get emailList() {
        // Return a comma-delimited string of email addresses
        return this._emailCollection.join(',');
    }
    
    // Gets the effective maximum number of emails allowed
    getEffectiveMaxEmails() {
        // If a maxEmails value is provided and is a valid number between 0 and ABSOLUTE_MAX_EMAILS, use it
        if (this.maxEmails !== undefined && this.maxEmails !== null) {
            const parsedMax = parseInt(this.maxEmails, 10);
            if (!isNaN(parsedMax) && parsedMax >= 0 && parsedMax <= this.ABSOLUTE_MAX_EMAILS) {
                return parsedMax;
            }
        }
        // Otherwise, use the absolute maximum
        return this.ABSOLUTE_MAX_EMAILS;
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
    
    // Handle paste events for multiple emails
handlePaste(event) {
    // Don't process if disabled
    if (this.disabled) return;
    
    // Prevent the default paste behavior
    event.preventDefault();
    
    // Get pasted text from clipboard
    const pastedText = (event.clipboardData || window.clipboardData).getData('text');
    
    if (pastedText && pastedText.trim()) {
        // First replace all standard delimiters with a common delimiter
        // This ensures mixed delimiters are properly handled
        let normalizedText = pastedText
            .replace(/[,;]/g, '|') // Replace commas and semicolons with pipe
            .replace(/[\r\n]+/g, '|'); // Replace newlines with pipe
        
        // Now check if there are potential space-separated emails
        // Look for patterns that resemble email addresses (contain @)
        if (normalizedText.includes(' ') && normalizedText.includes('@')) {
            // This regex looks for email-like patterns and adds a delimiter before each email
            // except the first one
            normalizedText = normalizedText.replace(/\s+([^\s|@]+@[^\s|@]+)/g, '|$1');
        }
        
        // Split by our common delimiter and filter out empty entries
        const emails = normalizedText
            .split('|')
            .map(email => email.trim())
            .filter(email => email !== '' && email.includes('@')); // Basic check for email format
        
        // Process emails if we found any
        if (emails.length > 0) {
            // Calculate how many emails we can add (respect max limit)
            const effectiveMaxEmails = this.getEffectiveMaxEmails();
            const remainingSlots = effectiveMaxEmails - this.selectedEmails.length;
            
            if (remainingSlots <= 0) {
                if (this.maxEmailsErrorMessage && this.maxEmailsErrorMessage.trim() !== '') {
                    this.setError(this.maxEmailsErrorMessage);
                } else {
                    this.setError(`You can only add up to ${effectiveMaxEmails} email addresses.`);
                }
                return;
            }
            
            // Calculate how many emails we can add
            const emailsToAdd = emails.slice(0, remainingSlots);
            
            // Add emails without validation (as per requirements)
            let duplicatesSkipped = 0;
            emailsToAdd.forEach(email => {
                // Skip duplicates silently
                if (this.selectedEmails.some(item => item.value.toLowerCase() === email.toLowerCase())) {
                    duplicatesSkipped++;
                } else {
                    // Add email without validation
                    const newEmail = {
                        id: this.generateUniqueId(),
                        value: email
                    };
                    this.selectedEmails = [...this.selectedEmails, newEmail];
                }
            });
            
            // Provide appropriate feedback
            if (emails.length > remainingSlots) {
                this.setError(`Only ${remainingSlots} of ${emails.length} emails were added due to the maximum limit of ${effectiveMaxEmails}.`);
            } 
            else if (duplicatesSkipped > 0) {
                this.setError(`${duplicatesSkipped} duplicate email${duplicatesSkipped > 1 ? 's were' : ' was'} skipped.`);
            }
            
            // Clear input field
            this.inputValue = '';
            this.template.querySelector('input').value = '';
            
            // Dispatch change event
            this.dispatchValueChangedEvent();
        } else {
            // Just paste as-is if no valid emails were detected
            this.inputValue = pastedText;
            this.template.querySelector('input').value = pastedText;
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
    
    // Helper method to determine if a message is rich text
    isRichText(message) {
        return message && (
            message.includes('<') && 
            message.includes('>')
        );
    }
    
    // Method to validate and add emails
    validateAndAddEmail(emailValue) {
        const email = emailValue.trim();
        
        if (!email) return;
        
        // First validate basic email format
        if (!this.isValidEmail(email)) {
            if (this.invalidEmailErrorMessage && this.invalidEmailErrorMessage.trim() !== '') {
                this.setError(this.invalidEmailErrorMessage);
            } else {
                this.setError('Please enter a valid email address.');
            }
            return;
        }
        
        // Then validate against domain rules
        const domainValidation = this.isDomainValid(email);
        if (!domainValidation.isValid) {
            // Use appropriate error message
            if (domainValidation.message) {
                this.setError(domainValidation.message);
            } else {
                this.setError('Email domain is not allowed.');
            }
            return;
        }
        
        // Check if we've reached maximum emails
        const effectiveMaxEmails = this.getEffectiveMaxEmails();
        if (this.selectedEmails.length >= effectiveMaxEmails) {
            if (this.maxEmailsErrorMessage && this.maxEmailsErrorMessage.trim() !== '') {
                this.setError(this.maxEmailsErrorMessage);
            } else {
                this.setError(`You can only add up to ${effectiveMaxEmails} email addresses.`);
            }
            return;
        }
        
        // Check if email is already added
        if (this.selectedEmails.some(item => item.value.toLowerCase() === email.toLowerCase())) {
            if (this.duplicateEmailErrorMessage && this.duplicateEmailErrorMessage.trim() !== '') {
                this.setError(this.duplicateEmailErrorMessage);
            } else {
                this.setError('This email has already been added.');
            }
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
isDomainValid(email) {
    // Extract domain from email
    const domain = email.split('@')[1]?.toLowerCase();
    if (!domain) return { isValid: false, errorType: 'format', message: 'Invalid email format.' };
    
    // If no domain rules specified, all domains are valid
    const hasAllowedDomains = this.allowedDomains && this.allowedDomains.trim() !== '';
    const hasBlockedDomains = this.blockedDomains && this.blockedDomains.trim() !== '';
    
    if (!hasAllowedDomains && !hasBlockedDomains) {
        return { isValid: true };
    }
    
    // Check against blocked domains first (if specified)
    if (hasBlockedDomains) {
        const blockedDomainsList = this.blockedDomains
            .split(',')
            .map(d => d.trim().toLowerCase())
            .filter(d => d !== '');
            
        // If domain matches any blocked pattern, it's invalid
        if (blockedDomainsList.some(blockedDomain => this.domainMatchesPattern(domain, blockedDomain))) {
            if (this.blockedDomainsErrorMessage && this.blockedDomainsErrorMessage.trim() !== '') {
                return { isValid: false, errorType: 'blocked', message: this.blockedDomainsErrorMessage };
            }
            return { isValid: false, errorType: 'blocked', message: 'This email domain is not allowed.' };
        }
    }
    
    // If allowed domains are specified, domain must match at least one
    if (hasAllowedDomains) {
        const allowedDomainsList = this.allowedDomains
            .split(',')
            .map(d => d.trim().toLowerCase())
            .filter(d => d !== '');
            
        // Check if the email domain matches any allowed pattern
        const isAllowed = allowedDomainsList.some(allowedDomain => 
            this.domainMatchesPattern(domain, allowedDomain));
        
        if (!isAllowed) {
            if (this.allowedDomainsErrorMessage && this.allowedDomainsErrorMessage.trim() !== '') {
                return { isValid: false, errorType: 'allowed', message: this.allowedDomainsErrorMessage };
            }
            return { isValid: false, errorType: 'allowed', message: 'This email domain is not in the allowed list.' };
        }
    }
    
    // If we have only blocked domains and domain is not blocked, it's valid
    return { isValid: true };
}
    
    // Helper method to check if a domain matches a pattern (including wildcards)
    domainMatchesPattern(domain, pattern) {
        // If the pattern is an exact match
        if (domain === pattern) {
            return true;
        }
        
        // Check for wildcard pattern (e.g., *.example.com)
        if (pattern.startsWith('*.')) {
            const patternSuffix = pattern.substring(1); // get the .example.com part
            return domain.endsWith(patternSuffix);
        }
        
        return false;
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
        
        // Also dispatch a Flow attribute change event for the comma-delimited email list
        this.dispatchEvent(new FlowAttributeChangeEvent('emailList', emailValues.join(',')));
        
        // Also dispatch a regular event for non-Flow usages
        this.dispatchEvent(new CustomEvent('emailschanged', {
            detail: {
                emails: emailValues,
                emailList: emailValues.join(',')
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
        errors.push('Please enter at least one email address.');
    }
    
    // Check if we're exceeding max emails
    const effectiveMaxEmails = this.getEffectiveMaxEmails();
    if (this.selectedEmails.length > effectiveMaxEmails) {
        if (this.maxEmailsErrorMessage && this.maxEmailsErrorMessage.trim() !== '') {
            errors.push(this.maxEmailsErrorMessage);
        } else {
            errors.push(`You can only add up to ${effectiveMaxEmails} email addresses.`);
        }
    }
    
    // Check domain validation if needed
    const hasAllowedDomains = this.allowedDomains && this.allowedDomains.trim() !== '';
    const hasBlockedDomains = this.blockedDomains && this.blockedDomains.trim() !== '';
    
    if ((hasAllowedDomains || hasBlockedDomains) && this.selectedEmails.length > 0) {
        // Check if all emails pass the domain validation
        const invalidEmail = this.selectedEmails.find(emailObj => {
            const result = this.isDomainValid(emailObj.value);
            return !result.isValid;
        });
        
        if (invalidEmail) {
            // Use either the appropriate specific error message based on the validation failure type
            const validationResult = this.isDomainValid(invalidEmail.value);
            if (validationResult.message) {
                errors.push(validationResult.message);
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
    }}