# Hello, World!

[Read the full changelog here.](https://github.com/chrisrouse/multiEmailInput/blob/main/CHANGELOG.md)

Thanks for checking out the Multi Email Input LWC for Salesforce Screen Flows! I built this package because I couldn't find any other component that did what I wanted. While working on a form being built in a screen flow I had a requirement to allow the end users to enter several additional emails. That's fine, users can enter it in a text box and I can process it after with several extra steps, but what if there was an easier way??? Enter **Multi Email Input**! No more formulas or loops to parse user data that may or may not follow a consistent pattern. No clunky repeater element to deal with. This is a simple way to capture as many additional email addresses as your end user wants to enter!

This component works with SLDS1 and SLDS2. It looks great in SLDS2!

<img width="1599" alt="Screenshot 2025-03-14 at 5 43 36 PM" src="https://github.com/user-attachments/assets/ba98618c-8327-4233-8701-224b2e6aa4fe" />

# Installation
Feel free to install the files diretly or you can use the package links below. Package links may be behind the source code at times.

## Package Links

There is a bug in the current version. If you don't set an allowed or blocked domain, you will run into a validation error.
[Sandbox](https://test.salesforce.com/packaging/installPackage.apexp?p0=04tHo000000tBg3IAE)

[Production](https://login.salesforce.com/packaging/installPackage.apexp?p0=04tHo000000tBg3IAE)


# Setup
![2025-03-14_17-03-41](https://github.com/user-attachments/assets/0d108a77-60e5-4771-ad90-d5b84b9f25cf)

This component has several customizable fields.
1. **API Name** You know this field!
2. **Allowed Domains** Input a comma-seperated list of domains. This can be created with a text collection or as plain text. *Example: gmail.com, yahoo.com, aol.com*.
3. **Blocked Domains** Input a comma-seperated list of domains. This can be created with a text collection or as plain text. *Example: gmail.com, yahoo.com, aol.com*.
4. **Wildcard Domains** You can now include `*.edu`, for example, in the allowed or blocked list. 
5. **Disabled** Set this to true or false using a global variable or a formula. When Disabled=TRUE, pills are hidden.
8. **Maximum Emails** Limit how many emails your user can add. Leave blank if you don't want to limit this. Has a default max of 150, which is the Salesforce limit for emails.
10. **Required** Use a global variable or a formula to make this field required.
11. **Value** Select a text collection of email addresses to prepolate the component.
12. **Output Variables** Automatically output both a collection `[email;email]` and text `email, email` from the component. If you're using the native Send Email flow action, this allows you to use the same component with the Recipient Collection or with the CC/BCC fields using the text output.
13. **Error Messages** Everything has default error messages built in, but you can also use custom error messages, including rich text for most of the fields.
    

# Entering email addresses

After typing in a valid email address, press space, enter, or tab to add the address. Space and enter will keep the focus in the text field while tab will move to the next selection. Email inputs are evaluated by the Allowed Domains and Blocked Domains list simultaneously. 

# Remove email address

Click the X in the pill to remove na email address from the collection.

# Outputs
You can make everything to custom variables if you want to.

# Known Issues and Limitations
1. If your initial collection (Value) does not meet the limits of Allowed Domains and Maximum Emails, it will not be evaluated until you attempt to add another value to the collection or when you advance to the next screen. It is not evaluated at the initial loading of the screen.
