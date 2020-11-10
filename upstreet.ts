const fetch = require('node-fetch');

class VerifyDocumentError extends Error {
    constructor(message) {
        super();
        this.message = message;
    }
}

async function checkCustomer(params) {    
    const URL = "https://australia-southeast1-reporting-290bc.cloudfunctions.net/driverlicence";
    
    const API_KEY = "03aa7ba718da920e0ea362c876505c6df32197940669c5b150711b03650a78cf";

    const response = await fetch(URL, {
        body: JSON.stringify(params),
        headers: {
            'token': API_KEY,
            'Content-Type': 'application/json'
        },
        method: 'POST'
    })
    
    if (!response.ok) {
        throw Error(response.statusText)
    } else {
        return response.json();
    }
}

async function getCustomer(dob, first_name, middle_name, last_name, license, state, expiry) {
    let body = {};
    let date_regex = /^\d{4}\-(0[1-9]|1[012])\-(0[1-9]|[12][0-9]|3[01])$/

    // Validate date of birth
    if (date_regex.test(dob) === true) {
        body["birthDate"] = dob;
    } else {
        throw Error("Invalid date of birth (YYYY-MM-DD)")
    }

    // Validate first name and last name 
    if (!first_name || !last_name) {
        throw Error("First and last names must be provided")
    } else if (first_name.length <= 100 && last_name.length <= 100) {
        body["givenName"] = first_name;
        body["familyName"] = last_name;
    } else {
        throw Error("Invalid Name (field must not exceed 100 characters)")
    }

    // Validate middle name
    if (middle_name) {
        if (middle_name.length <= 100) {
            body["middleName"] = middle_name;
        } else {
            throw Error("Invalid Name (field must not exceed 100 characters)")
        }
    } 
        
    if (license) {
        body["licenceNumber"] = license;
    } else {
        throw Error("License Number must be provided")
    }

    // Validate state
    switch (state) {
        case "NSW":
        case "QLD":
        case "SA":
        case "TAS":
        case "VIC":
        case "WA":
        case "ACT":
        case "NT":
            body["stateOfIssue"] = state;
            break;
        default:
            throw Error("Must be a state in Australia")
    }

    // Validate expiry
    if (date_regex.test(expiry) === true) {
        body["expiryDate"] = expiry;
    } else {
        throw Error("Invalid expiry date (YYYY-MM-DD)")
    }
    
    const data = await checkCustomer(body);

    if (data.verificationResultCode === "Y") {
        return {'kycResult': true}
    } else if (data.verificationResultCode === "N") {
        return {'kycResult': true}
    } else if (data.verificationResultCode === "D") {
        throw new VerifyDocumentError("Document Error")
    } else if (data.verificationResultCode === "S") {
        throw new VerifyDocumentError("Server Error");
    } else {
        throw Error("Something happened");
    }
}

let promise = getCustomer("1985-02-08", "James", "Robert", "Smith", "1234521321", "NSW", "2020-01-01");
promise.then(data => {
    console.log(data);
}).catch(err => {
    console.log(err.message)
})

