import dns from 'dns';

dns.lookup('generativelanguage.googleapis.com', (err, address, family) => {
    if (err) {
        console.error('DNS Lookup Failed:', err);
    } else {
        console.log('Address:', address, 'Family: IPv', family);
        console.log('✅ DNS Lookup Success!');
    }
});
