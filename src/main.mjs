// src/main.mjs - Apify PPE Actor: Global B2B Entity, SEC EDGAR & CVE Enricher

export async function enrichCompanyRecord(company, options = {}) {
    const {
        includeSecFilings = true,
        includeCveAudit = true,
        includeDomainRdap = true
    } = options;

    const result = {
        companyName: company.name,
        cik: company.cik || null,
        domain: company.domain || null,
        enrichedAt: new Date().toISOString(),
        secEdgar: null,
        supplyChainCve: null,
        domainRdap: null,
        complianceScore: 100
    };

    // 1. SEC EDGAR Submission API (Zero-key, strict User-Agent requirement)
    if (includeSecFilings && company.cik) {
        try {
            const formattedCik = company.cik.toString().padStart(10, '0');
            const secUrl = `https://data.sec.gov/submissions/CIK${formattedCik}.json`;
            const secRes = await fetch(secUrl, {
                headers: {
                    'User-Agent': 'ComplianceBot/1.0 (contact: compliance@bouty-argon.org; automated audit)'
                }
            });

            if (secRes.ok) {
                const secData = await secRes.json();
                const recentFilings = secData.filings?.recent;
                const recentForms = [];
                if (recentFilings && recentFilings.form) {
                    const count = Math.min(5, recentFilings.form.length);
                    for (let i = 0; i < count; i++) {
                        recentForms.push({
                            form: recentFilings.form[i],
                            filingDate: recentFilings.filingDate[i],
                            reportDate: recentFilings.reportDate[i],
                            accessionNumber: recentFilings.accessionNumber[i]
                        });
                    }
                }

                result.secEdgar = {
                    status: 'SUCCESS',
                    entityType: secData.entityType,
                    sic: secData.sic,
                    sicDescription: secData.sicDescription,
                    fiscalYearEnd: secData.fiscalYearEnd,
                    stateOfIncorporation: secData.stateOfIncorporation,
                    recentFilingsCount: recentFilings?.form?.length || 0,
                    latestFilings: recentForms
                };
            } else {
                result.secEdgar = {
                    status: 'HTTP_ERROR',
                    statusCode: secRes.status,
                    message: `SEC API returned status ${secRes.status}`
                };
                result.complianceScore -= 10;
            }
        } catch (err) {
            result.secEdgar = { status: 'FETCH_FAILED', error: err.message };
            result.complianceScore -= 10;
        }
    }

    // 2. Google OSV.dev CVE Query (Zero-key open source supply-chain check)
    if (includeCveAudit && company.packageName) {
        try {
            const osvUrl = 'https://api.osv.dev/v1/query';
            const payload = {
                package: {
                    name: company.packageName,
                    ecosystem: company.ecosystem || 'npm'
                }
            };
            const osvRes = await fetch(osvUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (osvRes.ok) {
                const osvData = await osvRes.json();
                const vulns = osvData.vulns || [];
                result.supplyChainCve = {
                    status: 'SUCCESS',
                    vulnerabilityCount: vulns.length,
                    vulnerabilities: vulns.slice(0, 5).map(v => ({
                        id: v.id,
                        summary: v.summary || 'No summary available',
                        modified: v.modified,
                        details: v.details ? v.details.slice(0, 150) + '...' : ''
                    }))
                };
                if (vulns.length > 0) {
                    result.complianceScore -= Math.min(30, vulns.length * 5);
                }
            } else {
                result.supplyChainCve = { status: 'HTTP_ERROR', statusCode: osvRes.status };
            }
        } catch (err) {
            result.supplyChainCve = { status: 'FETCH_FAILED', error: err.message };
        }
    }

    // 3. RDAP Domain Registration Telemetry (Zero-key standard RFC 7482)
    if (includeDomainRdap && company.domain) {
        try {
            const rdapUrl = `https://rdap.org/domain/${encodeURIComponent(company.domain)}`;
            const rdapRes = await fetch(rdapUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Accept': 'application/rdap+json, application/json'
                },
                redirect: 'follow'
            });

            if (rdapRes.ok) {
                const rdapData = await rdapRes.json();
                const nameservers = (rdapData.nameservers || []).map(ns => ns.ldhName || ns.handle || 'NS');
                const statusList = rdapData.status || [];
                result.domainRdap = {
                    status: 'SUCCESS',
                    handle: rdapData.handle,
                    statusList: statusList,
                    nameservers: nameservers,
                    port43: rdapData.port43
                };
            } else {
                result.domainRdap = { status: 'HTTP_ERROR', statusCode: rdapRes.status };
            }
        } catch (err) {
            result.domainRdap = { status: 'FETCH_FAILED', error: err.message };
        }
    }

    result.complianceScore = Math.max(0, result.complianceScore);
    return result;
}

// Actor execution block in Apify Cloud environment
if (process.env.APIFY_IS_AT_HOME || process.env.APIFY_LOCAL_STORAGE_DIR) {
    const { Actor } = await import('apify');
    await Actor.init();

    const input = await Actor.getInput() || {};
    const {
        companies = [
            { name: 'Apple Inc.', cik: '0000320193', domain: 'apple.com', packageName: 'express', ecosystem: 'npm' },
            { name: 'Microsoft Corp.', cik: '0000789019', domain: 'microsoft.com', packageName: 'lodash', ecosystem: 'npm' }
        ],
        includeSecFilings = true,
        includeCveAudit = true,
        includeDomainRdap = true
    } = input;

    console.log(`Starting B2B Compliance Enrichment for ${companies.length} targets...`);

    for (const company of companies) {
        console.log(`Enriching: ${company.name}...`);
        const enriched = await enrichCompanyRecord(company, {
            includeSecFilings,
            includeCveAudit,
            includeDomainRdap
        });

        // Apify Pay-Per-Event Monetization ($0.05 per enriched record)
        if (Actor.charge) {
            try {
                await Actor.charge({ eventName: 'company-enriched' });
                console.log(`Charged PPE event: company-enriched for ${company.name}`);
            } catch (chargeErr) {
                console.warn(`PPE charge note: ${chargeErr.message}`);
            }
        }

        await Actor.pushData(enriched);
    }

    await Actor.exit();
}
