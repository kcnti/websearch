const dns = require('dns');

const options = {

    // Setting family as 6 i.e. IPv6
    family: 6,
    hints: dns.ADDRCONFIG | dns.V4MAPPED,
};

// Calling dns.lookup() for hostname geeksforgeeks.org
// and displaying them in console as a callback
dns.lookup('194.163.169.68', options, (err, address, family) =>
    console.log('address: %j family: IPv%s', address, family));