const dns = require('dns').promises;
const ip = 'ip';


const rvip = async () => {
    const domain = await dns.reverse(ip);
    console.log(domain);
}

rvip()
