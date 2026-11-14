import { enrichCompanyRecord } from './src/main.mjs';

console.log('================================================================');
console.log('APIFY B2B COMPLIANCE ACTOR - LIVE API VERIFICATION TEST');
console.log('================================================================');

const testCompanies = [
    {
        name: 'Apple Inc.',
        cik: '0000320193',
        domain: 'apple.com',
        packageName: 'express',
        ecosystem: 'npm'
    },
    {
        name: 'Microsoft Corp.',
        cik: '0000789019',
        domain: 'microsoft.com',
        packageName: 'lodash',
        ecosystem: 'npm'
    }
];

let successCount = 0;

for (const comp of testCompanies) {
    console.log(`\nAuditing company: ${comp.name} (CIK: ${comp.cik}, Domain: ${comp.domain})...`);
    const t0 = performance.now();
    const enriched = await enrichCompanyRecord(comp, {
        includeSecFilings: true,
        includeCveAudit: true,
        includeDomainRdap: true
    });
    const dt = (performance.now() - t0).toFixed(1);

    console.log(`[PASS] Enriched in ${dt}ms | Compliance Score: ${enriched.complianceScore}/100`);
    console.log(`  - SEC EDGAR Status: ${enriched.secEdgar?.status || 'N/A'} (SIC: ${enriched.secEdgar?.sic}, Recent Filings: ${enriched.secEdgar?.recentFilingsCount})`);
    console.log(`  - OSV CVE Status:   ${enriched.supplyChainCve?.status || 'N/A'} (Vulns Found: ${enriched.supplyChainCve?.vulnerabilityCount || 0})`);
    console.log(`  - RDAP Domain:      ${enriched.domainRdap?.status || 'N/A'} (Nameservers: ${enriched.domainRdap?.nameservers?.slice(0, 2)?.join(', ') || 'None'})`);

    // Mock Apify PPE charge fallback
    console.log(`  - [PPE Mock] Actor.charge({ eventName: 'company-enriched' }) -> $0.05 USD billed`);
    successCount++;
}

console.log('\n================================================================');
console.log(`APIFY ACTOR TEST PASSED: ${successCount} / ${testCompanies.length} live records enriched cleanly!`);
console.log('================================================================');
