
import { LightningElement, api, track } from 'lwc';
import { FlowAttributeChangeEvent } from 'lightning/flowSupport';

/**
 * MultiEmailInput - A component that allows users to enter multiple email addresses
 * with validation for domain rules and maximum entries.
 * Provides email collection as both an array and a comma-delimited string.
 */
export default class MultiEmailInput extends LightningElement {
    // ========================
    // CONSTANTS
    // ========================
    ABSOLUTE_MAX_EMAILS = 150; // Maximum allowed emails regardless of configuration

    // ========================
    // PUBLIC API PROPERTIES (@api)
    // ========================
    @api label = 'Email';                  // Field label
    @api placeholder = 'Enter an email address'; // Input placeholder text
    @api required = false;                 // Whether field is required
    @api helpText;                         // Help text to display in popover
    @api maxEmails;                        // Maximum number of emails allowed
    @api disabled = false;                 // Whether field is disabled
    @api allowedDomains = '';              // Comma-separated list of allowed domains
    @api blockedDomains = '';              // Comma-separated list of blocked domains
    @api allowedDomainsErrorMessage = '';  // Custom error message for allowed domains
    @api blockedDomainsErrorMessage = '';  // Custom error message for blocked domains
    @api invalidEmailErrorMessage = '';    // Custom error message for invalid email format
    @api maxEmailsErrorMessage = '';       // Custom error message for max emails exceeded
    @api duplicateEmailErrorMessage = '';  // Custom error message for duplicate emails
    
    // ========================
    // TRACKED PROPERTIES (@track)
    // ========================
    @track selectedEmails = [];          // Array of selected email objects {id, value}
    @track inputValue = '';              // Current value of the input field
    @track errorMessage = '';            // Current error message
    @track hasError = false;             // Whether component has an error
    @track showHelpPopover = false;      // Whether help popover is visible
    @track popoverPosition = 'bottom';   // Position of help popover (top/bottom)
    
    // ========================
    // PRIVATE PROPERTIES
    // ========================
    _value = [];                      // Internal storage for value property
    _emailCollection = [];            // Internal storage for emailCollection property
    _initialValuesSet = false;        // Flag to track if initial values have been set
    _pendingInitialValue = null;      // Storage for initial value if maxEmails not yet available
    
    // ========================
    // LIFECYCLE METHODS
    // ========================
    
    /**
     * Handles component initialization
     */
    connectedCallback() {
        console.log('Component initialized, maxEmails:', this.maxEmails);
        
        // If we have pending initial values to process, do it now
        if (this._pendingInitialValue && !this._initialValuesSet) {
            this.processInitialValues(this._pendingInitialValue);
            this._pendingInitialValue = null;
        }
    }
    
    /**
     * Clean up event listeners when component is removed
     */
    disconnectedCallback() {
        this.removeDocumentClickListener();
    }
 // ========================
    // COMPUTED PROPERTIES (GETTERS)
    // ========================
    
    /**
     * Returns appropriate CSS class for pill container based on content
     */
    get pillContainerClass() {
        return this.selectedEmails.length > 0 
            ? 'slds-pill_container has-pills' 
            : 'slds-pill_container';
    }
    
    /**
     * Determines if error message contains HTML tags (rich text)
     */
    get isRichTextError() {
        return this.errorMessage && (
            this.errorMessage.includes('<') && 
            this.errorMessage.includes('>')
        );
    }
    
    /**
     * Returns appropriate class for popover based on position
     */
    get popoverClass() {
        return this.popoverPosition === 'bottom' 
            ? 'slds-popover slds-nubbin_top-left' 
            : 'slds-popover slds-nubbin_bottom-left';
    }
    
    // ========================
    // PUBLIC API GETTERS/SETTERS
    // ========================
    
    /**
     * Getter for value property - returns array of email addresses
     */
    @api
    get value() {
        return this._value;
    }
    
    /**
     * Setter for value property - handles initialization of component with values
     */
    set value(value) {
        this._value = value;
        
        // If component is initializing and we have values
        if (Array.isArray(value) && value.length > 0 && this.selectedEmails.length === 0) {
            console.log('Setting initial value, maxEmails:', this.maxEmails);
            
            // If maxEmails is still undefined, store values for later processing
            if (this.maxEmails === undefined || this.maxEmails === null) {
                console.log('Max emails not available, storing values for later');
                this._pendingInitialValue = [...value];
                
                // Delay processing to allow Flow to initialize properties
                setTimeout(() => {
                    console.log('Rechecking maxEmails after delay:', this.maxEmails);
                    
                    // Only process if we haven't already and still have pending values
                    if (!this._initialValuesSet && this._pendingInitialValue) {
                        this.processInitialValues(this._pendingInitialValue);
                        this._pendingInitialValue = null;
                    }
                }, 250);
            } else {
                // Process immediately if maxEmails is available
                this.processInitialValues(value);
            }
        }
    }
    
    /**
     * Getter for emailCollection property - output collection for Flow
     */
    @api
    get emailCollection() {
        return this._emailCollection;
    }
    
    /**
     * Setter for emailCollection property
     */
    set emailCollection(value) {
        this._emailCollection = value;
    }
    
    /**
     * Getter for emailList property - returns comma-delimited string of emails
     */
    @api
    get emailList() {
        return this._emailCollection.join(',');
    }
    
// ========================
    // CORE VALIDATION METHODS
    // ========================
    
    /**
     * Gets the effective maximum number of emails allowed
     * Handles different data types and ensures value is within acceptable range
     */
    getEffectiveMaxEmails() {
        // Debug the incoming value
        console.log('Raw maxEmails value:', this.maxEmails, 'Type:', typeof this.maxEmails);
        
        // If a maxEmails value is provided, attempt to parse it properly
        if (this.maxEmails !== undefined && this.maxEmails !== null) {
            // Flow often passes numbers as strings, so we need to handle both cases
            let parsedMax = this.maxEmails;
            
            // If it's a string, parse it to a number
            if (typeof this.maxEmails === 'string') {
                parsedMax = parseInt(this.maxEmails, 10);
            }
            
            console.log('Parsed maxEmails:', parsedMax);
            
            // Verify it's a valid number in the acceptable range
            if (!isNaN(parsedMax) && parsedMax >= 0 && parsedMax <= this.ABSOLUTE_MAX_EMAILS) {
                return parsedMax;
            }
        }
        
        // Otherwise, use the absolute maximum
        return this.ABSOLUTE_MAX_EMAILS;
    }
    
    /**
     * Validates email format using regex
     */
    isValidEmail(email) {
        const emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return emailRegex.test(email);
    }
    
    /**
     * Validates email domain against allowed and blocked domains
     * Returns object with validation result and error information
     */
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
    
    /**
     * Checks if a domain matches a pattern, supporting wildcards in any position
     * Supports exact match and wildcard patterns like *example*, *.example.com, etc.
     */
    domainMatchesPattern(domain, pattern) {
        // If the pattern is an exact match
        if (domain === pattern) {
            return true;
        }
        
        // Check if pattern contains wildcard
        if (pattern.includes('*')) {
            // Convert the pattern to a regex pattern
            // Escape special regex characters except for *
            const regexPattern = pattern
                .replace(/[.+?^${}()|[\]\\]/g, '\\$&') // Escape special regex chars
                .replace(/\*/g, '.*'); // Replace * with .* for regex
            
            // Create a RegExp object with the pattern and check if domain matches
            const regex = new RegExp(`^${regexPattern}$`);
            return regex.test(domain);
        }
        
        return false;
    }
    
    /**
     * Collects all validation errors for the component
     * Used by checkValidity and reportValidity
     */
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
    
    // ========================
    // ERROR HANDLING METHODS
    // ========================
    
    /**
     * Sets component error state with a message
     */
    setError(message) {
        this.hasError = true;
        this.errorMessage = message;
    }
    
    /**
     * Clears error state for the component
     */
    clearErrorState() {
        this.hasError = false;
        this.errorMessage = '';
    }
    
    /**
     * Helper method to determine if a message is rich text
     */
    isRichText(message) {
        return message && (
            message.includes('<') && 
            message.includes('>')
        );
    }
    
    /**
     * Formats multiple error messages, optionally as an HTML list
     */
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
    
    // ========================
    // INITIAL VALUE PROCESSING
    // ========================
    
    /**
     * Processes initial values with validation
     * Validates domains, maximum limit, and duplicates
     * Updates component state and error messages
     */
    processInitialValues(value) {
        console.log('Processing initial values, maxEmails:', this.maxEmails);
        
        // Mark that we've processed initial values to avoid duplicates
        this._initialValuesSet = true;
        
        // Collect validation issues with the initial set
        const errors = [];
        let filteredEmails = [...value]; // Create a copy to avoid modifying the original
        
        // ---- STEP 1: Apply domain validation first (allowed domains) ----
        const hasAllowedDomains = this.allowedDomains && this.allowedDomains.trim() !== '';
        const hasBlockedDomains = this.blockedDomains && this.blockedDomains.trim() !== '';
        
        // Process allowed domains first
        if (hasAllowedDomains) {
            // Save length before filtering
            const beforeLength = filteredEmails.length;
            
            // Filter based on allowed domains
            filteredEmails = filteredEmails.filter(email => {
                const result = this.isDomainValid(email);
                // We're only concerned with allowedDomains errors here
                return result.isValid || result.errorType !== 'allowed';
            });
            
            // Calculate how many were removed
            const invalidDomainCount = beforeLength - filteredEmails.length;
            
            // Add error message if needed
            if (invalidDomainCount > 0) {
                if (invalidDomainCount === 1) {
                    errors.push('1 email with domain not in the allowed list was removed.');
                } else {
                    errors.push(`${invalidDomainCount} emails with domains not in the allowed list were removed.`);
                }
            }
            
            // If no emails remain, stop validation
            if (filteredEmails.length === 0) {
                this.setError(errors[0]); // Only show allowed domains error
                this.setEmails([]);
                return;
            }
        }
        
        // ---- STEP 2: Apply domain validation (blocked domains) if emails remain ----
        if (hasBlockedDomains && filteredEmails.length > 0) {
            // Save length before filtering
            const beforeLength = filteredEmails.length;
            
            // Filter based on blocked domains
            filteredEmails = filteredEmails.filter(email => {
                const result = this.isDomainValid(email);
                // We're only concerned with blockedDomains errors here
                return result.isValid || result.errorType !== 'blocked';
            });
            
            // Calculate how many were removed
            const blockedCount = beforeLength - filteredEmails.length;
            
            // Add error message if needed
            if (blockedCount > 0) {
                if (blockedCount === 1) {
                    errors.push('1 email with blocked domain was removed.');
                } else {
                    errors.push(`${blockedCount} emails with blocked domains were removed.`);
                }
            }
            
            // If no emails remain, stop validation
            if (filteredEmails.length === 0) {
                // Only show domain-related errors
                this.setError(this.formatErrorMessages(errors));
                this.setEmails([]);
                return;
            }
        }
        
        // ---- STEP 3: Apply maximum email limit (only if emails remain) ----
        if (filteredEmails.length > 0) {
            const effectiveMaxEmails = this.getEffectiveMaxEmails();
            console.log('Effective Max Emails for initial values:', effectiveMaxEmails);
            console.log('Domain-filtered values length:', filteredEmails.length);
            
            // Check if we're over the max limit
            if (filteredEmails.length > effectiveMaxEmails) {
                const truncatedCount = filteredEmails.length - effectiveMaxEmails;
                filteredEmails = filteredEmails.slice(0, effectiveMaxEmails);
                
                // Add error message for max limit
                if (this.maxEmailsErrorMessage && this.maxEmailsErrorMessage.trim() !== '') {
                    errors.push(this.maxEmailsErrorMessage);
                } else {
                    errors.push(`You can only add up to ${effectiveMaxEmails} email address${effectiveMaxEmails > 1 ? 'es' : ''}. ${truncatedCount} excess email${truncatedCount > 1 ? 's were' : ' was'} removed.`);
                }
            }
        }
        
        // ---- STEP 4: Check for duplicates (only if emails remain) ----
        if (filteredEmails.length > 0) {
            const uniqueEmails = new Set();
            const finalEmails = [];
            let duplicateCount = 0;
            
            filteredEmails.forEach(email => {
                const lowerCase = email.toLowerCase();
                if (uniqueEmails.has(lowerCase)) {
                    duplicateCount++;
                } else {
                    uniqueEmails.add(lowerCase);
                    finalEmails.push(email);
                }
            });
            
            filteredEmails = finalEmails;
            
            if (duplicateCount > 0) {
                if (this.duplicateEmailErrorMessage && this.duplicateEmailErrorMessage.trim() !== '') {
                    errors.push(this.duplicateEmailErrorMessage);
                } else {
                    errors.push(`${duplicateCount} duplicate email${duplicateCount > 1 ? 's were' : ' was'} removed.`);
                }
            }
        }
        
        // Set error state if needed
        if (errors.length > 0) {
            this.hasError = true;
            this.errorMessage = this.formatErrorMessages(errors);
        } else {
            this.clearErrorState();
        }
        
        // Set the emails, using the final filtered list
        console.log('Setting filtered emails:', filteredEmails.length);
        this.setEmails(filteredEmails);
    }
    
    // ========================
    // INPUT EVENT HANDLING
    // ========================
    
    /**
     * Handles key presses in the input field
     * Processes Enter, Space, and Tab keys to add emails
     */
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
    
    /**
     * Handles input event to clear error state immediately on any input
     */
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
    
    /**
     * Handles input change to update the tracked inputValue
     */
    handleInputChange(event) {
        if (!this.disabled) {
            this.inputValue = event.target.value;
        }
    }
    
    /**
     * Handles when input field loses focus
     * Adds the email when input loses focus if there's text
     */
    handleBlur(event) {
        if (this.disabled) return;
        
        // Add the email when input loses focus if there's text
        const currentValue = event.target.value;
        if (currentValue && currentValue.trim()) {
            this.validateAndAddEmail(currentValue);
        }
    }
    
 /**
 * Handles paste events for multiple emails
 * Parses pasted content for multiple email addresses
 * Validates and adds all valid emails
 * Enhanced to support angle bracket email formats
 */
handlePaste(event) {
    // Don't process if disabled
    if (this.disabled) return;
    
    // Prevent the default paste behavior
    event.preventDefault();
    
    // Get pasted text from clipboard
    const pastedText = (event.clipboardData || window.clipboardData).getData('text');
    
    if (pastedText && pastedText.trim()) {
        // Create an array to store all found emails
        let emails = [];
        
        // Create a copy of the pasted text that we'll modify as we process it
        let processingText = pastedText;
        
        // First, try to find emails in angle brackets (name <email@example.com> format)
        if (pastedText.includes('<') && pastedText.includes('>')) {
            // This regex looks for email pattern inside angle brackets
            // It ensures we're capturing actual email addresses, not just any text in angle brackets
            const angleRegex = /(?:<)([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})(?:>)/g;
            let match;
            
            // Find all email addresses enclosed in angle brackets
            while ((match = angleRegex.exec(pastedText)) !== null) {
                if (match[1] && match[1].includes('@')) {
                    // Add to our email collection
                    emails.push(match[1].trim());
                    
                    // Remove this email from the processing text to avoid duplicate processing
                    // Replace with a space to maintain text structure
                    processingText = processingText.replace(match[0], ' ');
                }
            }
        }
        
        // Now parse the remaining text for regular emails
        // Replace all standard delimiters with a common delimiter
        let normalizedText = processingText
            .replace(/[,;]/g, '|') // Replace commas and semicolons with pipe
            .replace(/[\r\n]+/g, '|'); // Replace newlines with pipe
        
        // Check if there are potential space-separated emails
        if (normalizedText.includes(' ') && normalizedText.includes('@')) {
            // Add a delimiter before each email-like pattern (except the first one)
            normalizedText = normalizedText.replace(/\s+([^\s|@]+@[^\s|@]+)/g, '|$1');
        }
        
        // Split by our common delimiter and filter out empty entries
        const regularEmails = normalizedText
            .split('|')
            .map(item => item.trim())
            .filter(item => item !== '' && item.includes('@')); // Basic check for email format
            
        // Add regular emails to our collection
        emails = [...emails, ...regularEmails];
        
        // Process emails if we found any
        if (emails.length > 0) {
            // Collect validation issues
            const errors = [];
            
            // Filter out emails with invalid format
            let filteredEmails = emails.filter(email => this.isValidEmail(email));
            
            // If some emails had invalid format, add an error message
            const invalidFormatCount = emails.length - filteredEmails.length;
            if (invalidFormatCount > 0) {
                if (invalidFormatCount === 1) {
                    errors.push('1 email with invalid format was removed.');
                } else {
                    errors.push(`${invalidFormatCount} emails with invalid format were removed.`);
                }
                
                // If no valid emails remain, show error and stop
                if (filteredEmails.length === 0) {
                    this.setError(errors[0]);
                    return;
                }
            }
            
            // Continue with the rest of your validation logic...
            // (domain validation, duplicate checking, max limit, etc.)
            
            // ---- STEP 1: Apply domain validation first (allowed domains) ----
            const hasAllowedDomains = this.allowedDomains && this.allowedDomains.trim() !== '';
            const hasBlockedDomains = this.blockedDomains && this.blockedDomains.trim() !== '';
            
            // Process allowed domains first
            if (hasAllowedDomains) {
                // Save length before filtering
                const beforeLength = filteredEmails.length;
                
                // Filter based on allowed domains
                filteredEmails = filteredEmails.filter(email => {
                    const result = this.isDomainValid(email);
                    // We're only concerned with allowedDomains errors here
                    return result.isValid || result.errorType !== 'allowed';
                });
                
                // Calculate how many were removed
                const invalidDomainCount = beforeLength - filteredEmails.length;
                
                // Add error message if needed
                if (invalidDomainCount > 0) {
                    if (invalidDomainCount === 1) {
                        errors.push('1 email with domain not in the allowed list was removed.');
                    } else {
                        errors.push(`${invalidDomainCount} emails with domains not in the allowed list were removed.`);
                    }
                }
                
                // If no emails remain, stop validation
                if (filteredEmails.length === 0) {
                    this.setError(this.formatErrorMessages(errors));
                    return;
                }
            }
            
            // ---- STEP 2: Apply domain validation (blocked domains) if emails remain ----
            if (hasBlockedDomains && filteredEmails.length > 0) {
                // Save length before filtering
                const beforeLength = filteredEmails.length;
                
                // Filter based on blocked domains
                filteredEmails = filteredEmails.filter(email => {
                    const result = this.isDomainValid(email);
                    // We're only concerned with blockedDomains errors here
                    return result.isValid || result.errorType !== 'blocked';
                });
                
                // Calculate how many were removed
                const blockedCount = beforeLength - filteredEmails.length;
                
                // Add error message if needed
                if (blockedCount > 0) {
                    if (blockedCount === 1) {
                        errors.push('1 email with blocked domain was removed.');
                    } else {
                        errors.push(`${blockedCount} emails with blocked domains were removed.`);
                    }
                }
                
                // If no emails remain, stop validation
                if (filteredEmails.length === 0) {
                    this.setError(this.formatErrorMessages(errors));
                    return;
                }
            }
            
            // ---- STEP 3: Check for duplicates with existing emails ----
            let duplicatesWithExisting = 0;
            filteredEmails = filteredEmails.filter(email => {
                // Check against existing emails in the component
                const isDuplicate = this.selectedEmails.some(
                    existingEmail => existingEmail.value.toLowerCase() === email.toLowerCase()
                );
                
                if (isDuplicate) {
                    duplicatesWithExisting++;
                    return false;
                }
                return true;
            });
            
            if (duplicatesWithExisting > 0) {
                if (duplicatesWithExisting === 1) {
                    errors.push('1 duplicate email was skipped.');
                } else {
                    errors.push(`${duplicatesWithExisting} duplicate emails were skipped.`);
                }
            }
            
            // If no emails remain after duplicate checking, show error and stop
            if (filteredEmails.length === 0) {
                this.setError(this.formatErrorMessages(errors));
                return;
            }
            
            // ---- STEP 4: Apply maximum email limit (only if emails remain) ----
            const effectiveMaxEmails = this.getEffectiveMaxEmails();
            const remainingSlots = effectiveMaxEmails - this.selectedEmails.length;
            
            // Check if we already reached or exceeded the limit
            if (remainingSlots <= 0) {
                if (this.maxEmailsErrorMessage && this.maxEmailsErrorMessage.trim() !== '') {
                    this.setError(this.maxEmailsErrorMessage);
                } else {
                    this.setError(`You can only add up to ${effectiveMaxEmails} email address${effectiveMaxEmails > 1 ? 'es' : ''}.`);
                }
                return;
            }
            
            // Check if new emails would exceed the limit
            let truncatedCount = 0;
            if (filteredEmails.length > remainingSlots) {
                truncatedCount = filteredEmails.length - remainingSlots;
                filteredEmails = filteredEmails.slice(0, remainingSlots);
                
                if (this.maxEmailsErrorMessage && this.maxEmailsErrorMessage.trim() !== '') {
                    errors.push(this.maxEmailsErrorMessage);
                } else {
                    errors.push(`You can only add up to ${effectiveMaxEmails} email address${effectiveMaxEmails > 1 ? 'es' : ''}. ${truncatedCount} excess email${truncatedCount > 1 ? 's were' : ' was'} removed.`);
                }
            }
            
            // ---- STEP 5: Check for duplicates within the pasted emails ----
            const uniqueEmails = new Set();
            const finalEmails = [];
            let internalDuplicates = 0;
            
            filteredEmails.forEach(email => {
                const lowerCase = email.toLowerCase();
                if (uniqueEmails.has(lowerCase)) {
                    internalDuplicates++;
                } else {
                    uniqueEmails.add(lowerCase);
                    finalEmails.push(email);
                }
            });
            
            if (internalDuplicates > 0) {
                if (this.duplicateEmailErrorMessage && this.duplicateEmailErrorMessage.trim() !== '') {
                    errors.push(this.duplicateEmailErrorMessage);
                } else {
                    errors.push(`${internalDuplicates} duplicate email${internalDuplicates > 1 ? 's were' : ' was'} removed from the pasted content.`);
                }
            }
            
            // Add the filtered emails to the selection
            finalEmails.forEach(email => {
                const newEmail = {
                    id: this.generateUniqueId(),
                    value: email
                };
                this.selectedEmails = [...this.selectedEmails, newEmail];
            });
            
            // Display error messages if needed
            if (errors.length > 0) {
                this.setError(this.formatErrorMessages(errors));
            } else {
                this.clearErrorState();
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
    // ========================
    // EMAIL MANIPULATION METHODS
    // ========================
    
    /**
     * Validates and adds a single email address
     * Checks format, domain rules, max limit, and duplicates
     */
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
    
    /**
     * Add an email to the selected emails list - wrapper for backward compatibility
     */
    addEmail() {
        if (this.disabled) return;
        
        // Get value directly from the input element
        const inputElement = this.template.querySelector('input');
        if (inputElement) {
            this.validateAndAddEmail(inputElement.value);
        }
    }
    
    /**
     * Handle custom pill remove button click
     */
    handlePillRemove(event) {
        if (this.disabled) return;
        
        const idToRemove = event.currentTarget.dataset.id;
        this.selectedEmails = this.selectedEmails.filter(email => email.id !== idToRemove);
        this.dispatchValueChangedEvent();
        
        // Prevent event from bubbling up
        event.stopPropagation();
    }
    
    /**
     * Remove an email from the selected emails list (original method for backward compatibility)
     */
    handleRemoveEmail(event) {
        if (this.disabled) return;
        
        const idToRemove = event.detail.name;
        this.selectedEmails = this.selectedEmails.filter(email => email.id !== idToRemove);
        this.dispatchValueChangedEvent();
    }
    
    /**
     * Generate a unique ID for each email entry
     */
    generateUniqueId() {
        return 'email-' + Math.random().toString(36).substring(2, 9);
    }
    
    /**
     * Dispatch custom event when emails change
     * Updates internal collections and fires Flow attribute change events
     */
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
    
    // ========================
    // HELP POPOVER METHODS
    // ========================
    
    /**
     * Toggle help popover visibility
     */
// Focus the first focusable element in the popover
focusFirstElement() {
    const closeButton = this.template.querySelector('.slds-popover__close');
    if (closeButton) {
        closeButton.focus();
    }
}

// Focus the last focusable element in the popover
focusLastElement() {
    const closeButton = this.template.querySelector('.slds-popover__close');
    if (closeButton) {
        closeButton.focus();
    }
}

// Update your toggleHelpPopover method
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
            this.focusFirstElement();
            
            // Add keydown listener for Escape key to close the popover
            document.addEventListener('keydown', this.handleEscapeKey);
        }, 10);
    } else {
        // If closing, remove the listeners
        this.removeDocumentClickListener();
        document.removeEventListener('keydown', this.handleEscapeKey);
        
        // Return focus to the trigger button
        const helpButton = this.template.querySelector('.slds-button_icon');
        if (helpButton) {
            helpButton.focus();
        }
    }
}

// Update your closeHelpPopover method
closeHelpPopover(event) {
    // Prevent event from bubbling up
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    
    // Get reference to help button before closing popover
    const helpButton = this.template.querySelector('.slds-button_icon');
    
    // Close the popover
    this.showHelpPopover = false;
    
    // Remove document click listener
    this.removeDocumentClickListener();
    
    // Return focus to the help button for keyboard accessibility
    if (helpButton) {
        helpButton.focus();
    }
}
    
    /**
     * Determine if popover should appear above or below based on viewport position
     */
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
    
    /**
     * Close help popover
     */
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

    /**
     * Stop event propagation to prevent closing when clicking inside the popover
     */
    stopPropagation(event) {
        event.stopPropagation();
    }
    
    /**
     * Handle document click to close popover when clicking outside
     */
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
    
    /**
     * Handle Escape key for accessibility
     */
    handleEscapeKey = (event) => {
        // If Escape key is pressed and the popover is open, close it
        if (event.key === 'Escape' && this.showHelpPopover) {
            this.closeHelpPopover();
        }
    }

    /**
     * Helper to remove document click listener
     */
    removeDocumentClickListener() {
        document.removeEventListener('click', this.handleDocumentClick);
        document.removeEventListener('keydown', this.handleEscapeKey);
    }
    
    // ========================
    // PUBLIC API METHODS
    // ========================
    
    /**
     * Public method to clear all emails
     */
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

    /**
     * Public method to set emails programmatically
     */
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

    /**
     * Standard DOM validation method - required for Flow to validate properly
     * Returns whether the component is in a valid state
     */
    @api
    checkValidity() {
        // Collect all validation errors
        const errors = this.collectValidationErrors();
        
        // The field is valid if there are no errors
        return errors.length === 0;
    }

    /**
     * Standard DOM validation method - required for Flow to validate properly
     * Sets error state based on validation results and returns validity
     */
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

    /**
     * Flow validation method - validates component for Flow navigation
     * Returns validation object with status and optional error message
     */
    @api
    validate() {
        // First backup the current collection
        const backupCollection = JSON.parse(JSON.stringify(this.selectedEmails));
        
        // Perform full validation using reportValidity
        const isValid = this.reportValidity();
        
        if (!isValid) {
            // Schedule restoration after Flow processing
            setTimeout(() => {
                // Only restore if component is still in the DOM
                if (this.template.querySelector('input')) {
                    // Restore the collection from backup
                    this.selectedEmails = backupCollection;
                    // Update internal collections without dispatching events
                    this._value = this.selectedEmails.map(email => email.value);
                    this._emailCollection = this._value;
                }
            }, 0);
            
            // Return invalid status to prevent navigation
            return { 
                isValid: false,
                errorMessage: this.errorMessage
            };
        }
        
        // If validation passes, continue normally
        return { isValid: true };
    }
}