from bs4 import BeautifulSoup
import ipaddress as ipaddr
import grequests
import requests
import time
import sys
import re

asn = input("ASN: ")

header = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.45 Safari/537.36"
}
url_base = 'https://ipinfo.io/'
page = requests.get("https://ipinfo.io/"+asn, headers=header)
html_doc = page.content
soup = BeautifulSoup(html_doc, 'html.parser')

regx = "[0-9]+\.[0-9]+\.[0-9][0-9]+\.[0-9]+\/[0-9]+"
f = re.findall(regx, str(soup))
ips = list(set(f))

f = open('ranges.txt', 'w')
f.write('\n'.join(ips))
f.close()
