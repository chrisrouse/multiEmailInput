# Multi Email Input LWC Changelog

## v 1.0
- Initial release! Woo hoo!

## v 1.1
- Add

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
  - `invalidEmailErrorMessage`: Custom message for invalid email format
  - `maxEmailsErrorMessage`: Custom message when maximum email limit is reached
  - `duplicateEmailErrorMessage`: Custom message when adding duplicate email
  - `allowedDomainErrorMessage`: Custom message when domain is not in allowed list
  - `blockedDomainErrorMessage`: Custom message when domain is in blocked list

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
