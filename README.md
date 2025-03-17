# Hello, World!

**This is a learning project for me and I might accidentally break something at any time! Use this at your own risk and only if you're comfortable editing an LWC in VS Code to try to fix errors and bugs.**

Thanks for checking out the Multi Email Input LWC for Salesforce Screen Flows! I built this package because I couldn't find any other component that did what I wanted. While working on a form being built in a screen flow for a client, I had a requirement to allow the end users to enter several additional emails. This fine, users can enter it in a text box and I can process it after, but what if there was an easier way??? Enter **Multi Email Input**! No more formulas or loops to parse user data that may or may not follow a consistent pattern. No clunky repeater element to deal with. This is a simple way to capture as many additional email addresses as your end user wants to enter!

This component works with SLDS1 and SLDS2. It looks great in SLDS2!

<img width="1599" alt="Screenshot 2025-03-14 at 5 43 36 PM" src="https://github.com/user-attachments/assets/ba98618c-8327-4233-8701-224b2e6aa4fe" />

# Installation

For now, download this repository and add the files to Salesforce with Visual Studio Code or your preferred IDE. I'm working on getting this packaged.

# Setup
![2025-03-14_17-03-41](https://github.com/user-attachments/assets/0d108a77-60e5-4771-ad90-d5b84b9f25cf)

This component has several customizable fields.
1. **API Name** You know this field!
2. **Allowed Domains** Input a comma-seperated list of domains. This can be created with a text collection or as plain text. *Example: gmail.com, yahoo.com, aol.com*.
3. **Allowed Domains Error Message** Enter a custom error message. This supports plain text, a text string, or rich text. If you use plain text or a text string, the message is displayed using the standard Salesforce validation error style. Rich text is fully formatted.
4. **Disabled** Set this to true or false using a global variable or a formula. When Disabled=TRUE, pills are hidden.
5. **Help Text** Add useful help text for your users. Support plain text or a flow resource. Does not support rich text.
6. **Label** Give your field a name.
7. **Maximum Emails** Limit how many emails your user can add. Leave blank if you don't want to limit this.
8. **Placeholder Text** You can change this to your own placeholder text.
9. **Required** Use a global variable or a formula to make this field required.
10. **Value** Select a text collection of email addresses to prepolate the component.
11. **Output Variable** The component outputs `{!apiName.emailCollection}` with this formatting: '[email@one.com, email@two.com, email@three.com]`.

# Error Handling
## Allowed Domains
1. Enter your list of allowed domains or enter a resource for the domains.

<img width="413" alt="Screenshot 2025-03-14 at 5 28 07 PM" src="https://github.com/user-attachments/assets/b47b43b0-1266-4109-9962-aace23d9d878" />


2. When the user enters an invalid domain, they will be shown an error.

<img width="342" alt="Screenshot 2025-03-14 at 5 28 45 PM" src="https://github.com/user-attachments/assets/1ace7e55-0ba2-43da-831f-c65c24336e0d" />


3. Error messages support rich text.

<img width="1468" alt="Screenshot 2025-03-14 at 5 31 13 PM" src="https://github.com/user-attachments/assets/b60bdb2d-cc45-472c-a67a-b727190f1852" />

## Duplicate Entries
Duplicate Entries are automatically prevented. This error message is not configurable.

<img width="420" alt="Screenshot 2025-03-14 at 5 34 15 PM" src="https://github.com/user-attachments/assets/d764f741-8f95-4bb8-bfab-239ec8c9c33a" />

## Maximum Emails

Limit how many emails a user can enter. When they try to enter n+1, they are shown a default error message. This message cannot be configured.

<img width="413" alt="Screenshot 2025-03-14 at 5 35 29 PM" src="https://github.com/user-attachments/assets/dcf335a2-f40d-46ef-88cd-16f668f28b65" />

<img width="843" alt="Screenshot 2025-03-14 at 5 35 13 PM" src="https://github.com/user-attachments/assets/6ed98f04-737d-4584-a1b1-ae8780e8a180" />

## Invalid Emals
Email addresses are validated using `/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/`. This error message cannot be configured.

<img width="455" alt="Screenshot 2025-03-14 at 5 37 13 PM" src="https://github.com/user-attachments/assets/3457c4b8-c328-4b39-96ca-5dc805a1d700" />

# Help Text

<img width="467" alt="Screenshot 2025-03-14 at 5 40 16 PM" src="https://github.com/user-attachments/assets/b0bc4a7c-f194-4b2a-a9b6-897dd5268d8a" />


# Entering email addresses

After typing in a valid email address, press space, enter, or tab to add the address. Space and enter will keep the focus in the text field while tab will move to the next selection.

# Remove email address

Click the X in the pill to remove na email address from the collection.

# Outputs
You can make everything to custom variables if you want to.

# Known Issues and Limitations
1. If your initial collection (Value) does not meet the limits of Allowed Domains and Maximum Emails, it will not be evaluated until you attempt to add another value to the collection or when you advance to the next screen. It is not evaluated at the initial loading of the screen.