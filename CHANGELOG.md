# Multi Email Input LWC Changelog

## v 1.2.0
- Add support for pasting email address strings with mixed delimiters.
- Improve handling of validation rules for default values or copy/pasted values.
- Fix the order of operations when validating emails and track how many addresses are still in the collection so that confusing errors aren't shown. 
- Improve wildcard handling. Now you can use wildcard at any position, such as `*google*`, rather than only supporting at the beginning, like `*.google.com`. This now works in allowed and blocked domains.
- Improved HTML and CSS to better support SLDS and SLDS 2 by utilizing more native code and style hooks.
- Update handling for accessibility and keyboard navigation.

## v 1.1.1
- If no allowed or blocked domain was specified, the component said all emails were invalid. 

## v 1.1

### New Features

#### Domain Validation Enhancements
- **Wildcard Domain Support**: Added support for wildcard patterns in allowed domains
  - Example: `*.edu` will match any domain ending with `.edu` such as `university.edu` or `school.k12.edu`
  - Wildcard patterns must use the format `*.domain.tld`
- **Blocked Domains**: New `blockedDomains` property to specify domains that should be rejected
  - Works with both exact domains and wildcard patterns
  - When both allowed and blocked domains are specified, blocked domains take precedence
  - Example: Allow `*.company.com` but block `spam.company.com`

#### Email Limit Improvements
- **Hard Limit Enforcement**: Added hard maximum limit of 150 emails (Salesforce constraint)
- **Configurable Limits**: `maxEmails` property now accepts values between 0-150
- **Default Maximum**: If `maxEmails` is not specified, defaults to 150
- **Parameter Validation**: Added validation to ensure `maxEmails` is a valid integer within range

#### Customizable Error Messages
- **Rich Text Support**: All error messages now support rich text formatting
- **New Error Message Properties**:
  - `Invalid Email Error Message`: Custom message for invalid email format
  - `Maximum Emails Error Message`: Custom message when maximum email limit is reached
  - `Duplicate Emails Error Message`: Custom message when adding duplicate email
  - `Allowed Domains Error Message`: Custom message when domain is not in allowed list
  - `Blocked Domains Error Message`: Custom message when domain is in blocked list

### Improvements
- **Error Message Consistency**: All default error messages now end with a period
- **Domain Validation Logic**: Enhanced to handle complex scenarios with both allowed and blocked domains
- **Code Organization**: Added helper methods for better code structure and maintainability
- **Property Grouping**: Organized properties in the configuration XML for better readability

### Bug Fixes
- Fixed inconsistent handling of max emails across different validation scenarios
- Improved domain extraction and validation for edge cases

### Technical Details

#### New Methods
- `domainMatchesPattern(domain, pattern)`: Handles both exact and wildcard domain matching
- `getEffectiveMaxEmails()`: Computes the effective maximum limit considering all constraints
- `isRichText(message)`: Determines if a message contains HTML formatting
- Enhanced `isDomainValid(email)`: Now handles both allowed and blocked domain rules

#### Updated XML Configuration
- Added new properties with appropriate descriptions and validation
- Organized properties into logical groups for better user experience
- Added min/max validation for the `maxEmails` property

## v 1.0
- Initial release! 