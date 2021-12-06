const dns = require('dns').promises;
const ip = '194.163.169.68';


const rvip = async () => {
    const domain = await dns.reverse(ip);
    console.log(domain);
}

rvip()