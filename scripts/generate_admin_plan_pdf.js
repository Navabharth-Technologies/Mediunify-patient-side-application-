const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>MediUnify — Admin & Super Admin System Architecture & 1:1 Database Specification</title>
<style>
  @page {
    size: A4;
    margin: 18mm 16mm 18mm 16mm;
    @bottom-right {
      content: "Page " counter(page) " of " counter(pages);
      font-size: 8pt;
      color: #64748b;
    }
  }
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    color: #1e293b;
    background: #ffffff;
    font-size: 9.5pt;
    line-height: 1.45;
  }
  
  .page-break {
    page-break-before: always;
  }
  .avoid-break {
    page-break-inside: avoid;
  }
  
  /* COVER / HEADER BANNER */
  .doc-header {
    border-bottom: 3px solid #0D9488;
    padding-bottom: 14px;
    margin-bottom: 20px;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }
  .doc-title-box h1 {
    font-size: 20pt;
    color: #0F766E;
    font-weight: 800;
    letter-spacing: -0.5px;
  }
  .doc-title-box h2 {
    font-size: 11pt;
    color: #475569;
    font-weight: 600;
    margin-top: 3px;
  }
  .doc-badge {
    background: #F0FDFA;
    border: 1.5px solid #0D9488;
    color: #0F766E;
    padding: 6px 12px;
    border-radius: 8px;
    font-size: 8pt;
    font-weight: 700;
    text-align: right;
  }
  
  .meta-strip {
    background: #F8FAFC;
    border: 1px solid #E2E8F0;
    border-radius: 8px;
    padding: 10px 14px;
    margin-bottom: 20px;
    display: flex;
    justify-content: space-between;
    font-size: 8.5pt;
  }
  .meta-item strong {
    color: #0F766E;
  }
  
  /* HEADINGS */
  h2.sec-heading {
    font-size: 13pt;
    color: #0F766E;
    border-bottom: 1.5px solid #CCFBF1;
    padding-bottom: 4px;
    margin-top: 18px;
    margin-bottom: 10px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.3px;
  }
  h3.sub-heading {
    font-size: 10.5pt;
    color: #1E3A8A;
    margin-top: 12px;
    margin-bottom: 6px;
    font-weight: 700;
  }
  p {
    margin-bottom: 8px;
    color: #334155;
  }
  
  /* TABLES */
  table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 8px;
    margin-bottom: 14px;
    font-size: 8pt;
  }
  th {
    background: #0F766E;
    color: #FFFFFF;
    text-align: left;
    padding: 6px 8px;
    font-weight: 700;
    font-size: 8pt;
    border: 1px solid #0F766E;
  }
  td {
    padding: 5px 8px;
    border: 1px solid #E2E8F0;
    vertical-align: top;
  }
  tr:nth-child(even) td {
    background: #F8FAFC;
  }
  code {
    background: #EEF2F6;
    color: #0F766E;
    padding: 1px 4px;
    border-radius: 4px;
    font-family: "Courier New", Courier, monospace;
    font-size: 7.5pt;
    font-weight: 700;
  }
  
  /* ROLE BADGES */
  .badge-super {
    background: #FEF2F2;
    color: #991B1B;
    border: 1px solid #FECACA;
    padding: 2px 6px;
    border-radius: 4px;
    font-weight: 700;
    font-size: 7pt;
    display: inline-block;
  }
  .badge-clinical {
    background: #EFF6FF;
    color: #1E40AF;
    border: 1px solid #BFDBFE;
    padding: 2px 6px;
    border-radius: 4px;
    font-weight: 700;
    font-size: 7pt;
    display: inline-block;
  }
  .badge-fulfillment {
    background: #F0FDF4;
    color: #166534;
    border: 1px solid #BBF7D0;
    padding: 2px 6px;
    border-radius: 4px;
    font-weight: 700;
    font-size: 7pt;
    display: inline-block;
  }
  .badge-finance {
    background: #FFFBEB;
    color: #92400E;
    border: 1px solid #FDE68A;
    padding: 2px 6px;
    border-radius: 4px;
    font-weight: 700;
    font-size: 7pt;
    display: inline-block;
  }
  
  /* CALLOUT BOXES */
  .callout {
    border-left: 4px solid #0D9488;
    background: #F0FDFA;
    padding: 10px 12px;
    margin: 10px 0;
    border-radius: 0 6px 6px 0;
    font-size: 8.5pt;
  }
  .callout strong {
    color: #0F766E;
  }
  .callout-warning {
    border-left: 4px solid #F59E0B;
    background: #FFFBEB;
  }
  .callout-warning strong {
    color: #B45309;
  }
  
  /* FLOW BLOCKS */
  .flow-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
    margin: 10px 0;
  }
  .flow-card {
    background: #F8FAFC;
    border: 1px solid #CBD5E1;
    border-radius: 6px;
    padding: 8px;
    font-size: 7.8pt;
  }
  .flow-card-title {
    font-weight: 800;
    color: #0F766E;
    margin-bottom: 4px;
  }
</style>
</head>
<body>

<!-- HEADER -->
<div class="doc-header">
  <div class="doc-title-box">
    <h1>MediUnify Healthcare Platform</h1>
    <h2>Enterprise Admin & Super Admin System Architecture & 1:1 Database Mapping</h2>
  </div>
  <div class="doc-badge">
    SYSTEM ARCHITECTURE SPECIFICATION<br>
    VERSION 2.0 • CONFIDENTIAL
  </div>
</div>

<div class="meta-strip">
  <div class="meta-item"><strong>Platform:</strong> MediUnify Patient Ecosystem</div>
  <div class="meta-item"><strong>Author:</strong> Lead Enterprise Architect</div>
  <div class="meta-item"><strong>Database Engine:</strong> PostgreSQL / MongoDB (Mapped 1:1)</div>
  <div class="meta-item"><strong>Date:</strong> September 2026</div>
</div>

<div class="callout">
  <strong>Executive Intent:</strong> This document outlines the full multi-tier administrative governance model and the <strong>exact field-level database schema</strong> ensuring that patient-side app fields, backend server storage, and admin portals use <strong>100% identical naming conventions</strong> across all 14 clinical and operational modules.
</div>

<!-- SECTION 1 -->
<h2 class="sec-heading">1. Expanded 16-Tier Administrative Roles & Access Control (RBAC)</h2>
<p>To operate a complex multi-vendor healthcare ecosystem spanning doctors, diagnostic laboratories, imaging centers, retail pharmacies, fertility clinics, home healthcare agencies, and emergency ambulances, MediUnify implements 16 discrete administrative roles:</p>

<table>
  <thead>
    <tr>
      <th style="width: 14%;">Admin Role</th>
      <th style="width: 16%;">Role Category</th>
      <th style="width: 32%;">Primary Operational Scope</th>
      <th style="width: 20%;">Authorized Modules</th>
      <th style="width: 18%;">Audit & Compliance</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><code>SUPER_ADMIN</code></td>
      <td><span class="badge-super">Master Controller</span></td>
      <td>Unrestricted root access. System configs, financial payouts, global analytics, RBAC role grants, security overrides.</td>
      <td>All Modules (1 to 14)</td>
      <td>Full Audit Logging</td>
    </tr>
    <tr>
      <td><code>CITY_OPS_ADMIN</code></td>
      <td><span class="badge-super">Regional Operations</span></td>
      <td>Manages specific city operations (Mysuru, Bengaluru, etc.). Provider SLAs, local dispatch zones, regional escalations.</td>
      <td>Regional Clinics, Labs, Pharmacies</td>
      <td>Regional Audit</td>
    </tr>
    <tr>
      <td><code>CHIEF_MEDICAL_OFFICER</code></td>
      <td><span class="badge-clinical">Clinical Governance</span></td>
      <td>Doctor credentialing, medical license validation (KMC/MCI), clinical safety reviews, antibiotic prescribing audits.</td>
      <td>Doctors, Video Consults, EHR</td>
      <td>Medical Legal Log</td>
    </tr>
    <tr>
      <td><code>HOSPITAL_CLINIC_ADMIN</code></td>
      <td><span class="badge-clinical">Facility Network</span></td>
      <td>Onboards partner hospitals (e.g., Apollo BGS, Unnathi Clinic). Surgery cost estimates, inpatient bed allocations.</td>
      <td>Hospital Care, Surgeries, Quotes</td>
      <td>Facility Audit</td>
    </tr>
    <tr>
      <td><code>DOCTOR_PORTAL_ADMIN</code></td>
      <td><span class="badge-clinical">Doctor Desk</span></td>
      <td>Doctor slot calendars, leave management, in-clinic queuing, video telemedicine consultation room monitoring.</td>
      <td>Appointments, Slots, Telemedicine</td>
      <td>Doctor Activity Log</td>
    </tr>
    <tr>
      <td><code>PATHOLOGY_LAB_ADMIN</code></td>
      <td><span class="badge-fulfillment">Diagnostic Lab</span></td>
      <td>Pathology test catalog (CBC, HbA1c, Thyroid), wellness packages, phlebotomist sample collection tracking, report sign-off.</td>
      <td>Lab Tests, Packages, Reports</td>
      <td>NABL Sign-off Log</td>
    </tr>
    <tr>
      <td><code>PHLEBOTOMY_DISPATCHER</code></td>
      <td><span class="badge-fulfillment">Home Collection</span></td>
      <td>Assigns home sample collection requests to field phlebotomists. Barcode tracking, sample cold-chain temperature logs.</td>
      <td>Home Samples, Phlebotomists</td>
      <td>Sample Custody Chain</td>
    </tr>
    <tr>
      <td><code>RADIOLOGY_CENTER_ADMIN</code></td>
      <td><span class="badge-fulfillment">Imaging & Scans</span></td>
      <td>MRI/CT/Ultrasound slot allocations across Mysore Scans, Bharath Diagnostics. Radiologist report uploads, DICOM archives.</td>
      <td>Radiology Labs, Modalities, DICOM</td>
      <td>Radiology Review Log</td>
    </tr>
    <tr>
      <td><code>PHARMACY_STORE_ADMIN</code></td>
      <td><span class="badge-fulfillment">Pharmacy & Inventory</span></td>
      <td>Retail pharmacy inventory, medicine batch numbers, expiry dates, stock alerts, multi-store order routing.</td>
      <td>Medicines, Inventory, Batches</td>
      <td>Drug Controller Log</td>
    </tr>
    <tr>
      <td><code>RX_VERIFICATION_PHARMACIST</code></td>
      <td><span class="badge-clinical">Prescription Desk</span></td>
      <td>Split-screen prescription review. Validates Schedule H/H1 drugs, approves generic substitutes, flags invalid prescriptions.</td>
      <td>Prescription Queue, Order Approval</td>
      <td>Pharmacist Sign-off</td>
    </tr>
    <tr>
      <td><code>FERTILITY_IVF_COORDINATOR</code></td>
      <td><span class="badge-clinical">IVF & Reproductive Care</span></td>
      <td>Manages IVF/IUI patient journeys, dedicated counselor assignments, ART consent forms vault, 0% EMI finance approvals.</td>
      <td>Fertility, IVF/IUI, ART Consents</td>
      <td>ICMR ART Act Audit</td>
    </tr>
    <tr>
      <td><code>HOME_CARE_SUPERVISOR</code></td>
      <td><span class="badge-fulfillment">Home Healthcare</span></td>
      <td>Verified GNM/ANM home nurses, daily patient vital check logs, wound dressing photo records, visit schedule audits.</td>
      <td>Nurse Bookings, Staff Roster</td>
      <td>Nurse Visit Logs</td>
    </tr>
    <tr>
      <td><code>EQUIPMENT_RENTAL_ADMIN</code></td>
      <td><span class="badge-fulfillment">Equipment Fleet</span></td>
      <td>Hospital bed, oxygen concentrator, wheelchair inventory. Security deposits, delivery inspections, maintenance logs.</td>
      <td>Equipment Rental, Deposits</td>
      <td>Asset Inspection Log</td>
    </tr>
    <tr>
      <td><code>EMERGENCY_SOS_DISPATCHER</code></td>
      <td><span class="badge-super">Emergency Desk</span></td>
      <td>24/7 live audio-visual emergency feed. Dispatches nearest BLS/ALS ambulance, pre-notifies destination casualty trauma team.</td>
      <td>Ambulance SOS, GPS Dispatch</td>
      <td>Emergency SLA Log</td>
    </tr>
    <tr>
      <td><code>FINANCE_BILLING_ADMIN</code></td>
      <td><span class="badge-finance">Financials & Accounts</span></td>
      <td>Doctor payout settlements, vendor commission splits, Care+ VIP memberships, wallet top-ups, refund approvals.</td>
      <td>Ledgers, Payouts, Wallet, Gateway</td>
      <td>Financial Ledger Audit</td>
    </tr>
    <tr>
      <td><code>COMPLIANCE_PRIVACY_OFFICER</code></td>
      <td><span class="badge-super">Governance & Legal</span></td>
      <td>Audits every access to Electronic Health Records (EHR). Enforces DISHA, HIPAA, data privacy, and consent revocations.</td>
      <td>Audit Trails, Access Logs, Security</td>
      <td>Immutable Access Vault</td>
    </tr>
  </tbody>
</table>

<div class="page-break"></div>

<!-- SECTION 2 -->
<h2 class="sec-heading">2. Database Schema Specification (100% Identical Naming Between Patient App, Backend & Admin)</h2>
<p>To prevent data mismatches and broken synchronization, the table below specifies the <strong>exact field names</strong> used in the patient application (<code>database.json</code>, <code>dataSyncService.js</code>, <code>doctors.js</code>, <code>radiologyLabsData.js</code>, and <code>CartContext.js</code>) and their identical representation in the Super Admin database.</p>

<h3 class="sub-heading">2.1 Patient & User Profile (<code>users</code> Collection / Table)</h3>
<table>
  <thead>
    <tr>
      <th style="width: 22%;">Database & App Field Name</th>
      <th style="width: 14%;">Data Type</th>
      <th style="width: 26%;">Patient App State Source</th>
      <th style="width: 20%;">Super Admin Form / UI</th>
      <th style="width: 18%;">Validation & Rules</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><code>id</code></td>
      <td>String (PK)</td>
      <td><code>user.id</code> / <code>@userId</code></td>
      <td>Patient ID (Read-only)</td>
      <td>Format: <code>PAT-xxxx</code></td>
    </tr>
    <tr>
      <td><code>name</code></td>
      <td>String</td>
      <td><code>user.name</code> / <code>userName</code></td>
      <td>Full Patient Name Input</td>
      <td>Required, min 2 chars</td>
    </tr>
    <tr>
      <td><code>email</code></td>
      <td>String</td>
      <td><code>user.email</code> / <code>userEmail</code></td>
      <td>Email Address</td>
      <td>Valid Email Format, Unique</td>
    </tr>
    <tr>
      <td><code>phone</code></td>
      <td>String</td>
      <td><code>user.phone</code> / <code>userPhone</code></td>
      <td>Mobile Number</td>
      <td>Normalized E.164 (+91)</td>
    </tr>
    <tr>
      <td><code>password</code></td>
      <td>String (Hashed)</td>
      <td><code>user.password</code></td>
      <td>Reset Password Input</td>
      <td>bcrypt / argon2 hashed</td>
    </tr>
    <tr>
      <td><code>gender</code></td>
      <td>String</td>
      <td><code>user.gender</code></td>
      <td>Gender Selector Dropdown</td>
      <td>'Male' | 'Female' | 'Other'</td>
    </tr>
    <tr>
      <td><code>age</code></td>
      <td>String</td>
      <td><code>user.age</code></td>
      <td>Age Field</td>
      <td>e.g. '42 Yrs'</td>
    </tr>
    <tr>
      <td><code>city</code></td>
      <td>String</td>
      <td><code>user.city</code> / <code>selectedCity</code></td>
      <td>City Selector</td>
      <td>Mysore, Bangalore, etc.</td>
    </tr>
    <tr>
      <td><code>bloodGroup</code></td>
      <td>String</td>
      <td><code>user.bloodGroup</code></td>
      <td>Blood Group Dropdown</td>
      <td>O+, A+, B+, AB+, O-, etc.</td>
    </tr>
    <tr>
      <td><code>dob</code></td>
      <td>String</td>
      <td><code>user.dob</code></td>
      <td>Date of Birth Picker</td>
      <td>Format: DD/MM/YYYY</td>
    </tr>
    <tr>
      <td><code>emergencyContact</code></td>
      <td>String</td>
      <td><code>user.emergencyContact</code></td>
      <td>Emergency Contact Info</td>
      <td>e.g. '+91 98450 99999 (Brother)'</td>
    </tr>
    <tr>
      <td><code>address</code></td>
      <td>String</td>
      <td><code>user.address</code></td>
      <td>Street Address & Landmark</td>
      <td>Complete residential address</td>
    </tr>
    <tr>
      <td><code>walletBalance</code></td>
      <td>Number (Decimal)</td>
      <td><code>user.walletBalance</code></td>
      <td>Wallet Balance (Credit/Debit)</td>
      <td>Default 0, min 0</td>
    </tr>
    <tr>
      <td><code>carePoints</code></td>
      <td>Number (Integer)</td>
      <td><code>user.carePoints</code></td>
      <td>Care Points Balance</td>
      <td>Loyalty points ledger</td>
    </tr>
    <tr>
      <td><code>isVipMember</code></td>
      <td>Boolean</td>
      <td><code>user.isVipMember</code></td>
      <td>CARE+ VIP Status Badge</td>
      <td>True if active membership</td>
    </tr>
    <tr>
      <td><code>vipExpiryDate</code></td>
      <td>String (ISO Date)</td>
      <td><code>user.vipExpiryDate</code></td>
      <td>VIP Expiry Date</td>
      <td>ISO 8601 Timestamp</td>
    </tr>
    <tr>
      <td><code>abhaId</code></td>
      <td>String</td>
      <td><code>user.abhaId</code></td>
      <td>ABHA Health Account ID</td>
      <td>14-digit Ayushman Bharat ID</td>
    </tr>
  </tbody>
</table>

<h3 class="sub-heading">2.2 Family Members Sub-Document (<code>familyMembers</code> Array)</h3>
<table>
  <thead>
    <tr>
      <th style="width: 22%;">Database & App Field Name</th>
      <th style="width: 14%;">Data Type</th>
      <th style="width: 26%;">Patient App State Source</th>
      <th style="width: 20%;">Super Admin Form / UI</th>
      <th style="width: 18%;">Validation & Rules</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><code>id</code></td>
      <td>String</td>
      <td><code>familyMember.id</code></td>
      <td>Member ID</td>
      <td>Format: <code>FAM-xx</code></td>
    </tr>
    <tr>
      <td><code>name</code></td>
      <td>String</td>
      <td><code>familyMember.name</code></td>
      <td>Full Name</td>
      <td>Required</td>
    </tr>
    <tr>
      <td><code>relation</code></td>
      <td>String</td>
      <td><code>familyMember.relation</code></td>
      <td>Relationship Dropdown</td>
      <td>Spouse, Son, Daughter, Father, etc.</td>
    </tr>
    <tr>
      <td><code>age</code></td>
      <td>String</td>
      <td><code>familyMember.age</code></td>
      <td>Age</td>
      <td>Numerical string</td>
    </tr>
    <tr>
      <td><code>gender</code></td>
      <td>String</td>
      <td><code>familyMember.gender</code></td>
      <td>Gender</td>
      <td>'Male' | 'Female' | 'Other'</td>
    </tr>
    <tr>
      <td><code>bloodGroup</code></td>
      <td>String</td>
      <td><code>familyMember.bloodGroup</code></td>
      <td>Blood Group</td>
      <td>e.g. 'A+ Positive'</td>
    </tr>
    <tr>
      <td><code>phone</code></td>
      <td>String</td>
      <td><code>familyMember.phone</code></td>
      <td>Contact Phone</td>
      <td>Optional or 10-digit mobile</td>
    </tr>
  </tbody>
</table>

<div class="page-break"></div>

<h3 class="sub-heading">2.3 Doctors & Specialists Master (<code>doctors</code> Collection / Table)</h3>
<table>
  <thead>
    <tr>
      <th style="width: 20%;">Database & App Field Name</th>
      <th style="width: 14%;">Data Type</th>
      <th style="width: 26%;">Patient App (<code>doctors.js</code>)</th>
      <th style="width: 22%;">Super Admin Management</th>
      <th style="width: 18%;">Rules & Notes</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><code>id</code></td>
      <td>String (PK)</td>
      <td><code>item.id</code> (e.g. '1', '2')</td>
      <td>Doctor ID</td>
      <td>Unique identifier</td>
    </tr>
    <tr>
      <td><code>name</code></td>
      <td>String</td>
      <td><code>item.name</code></td>
      <td>Doctor Full Name</td>
      <td>Prefix: 'Dr. '</td>
    </tr>
    <tr>
      <td><code>specialty</code></td>
      <td>String</td>
      <td><code>item.specialty</code></td>
      <td>Specialty Title</td>
      <td>e.g. 'General Physician', 'Cardiologist'</td>
    </tr>
    <tr>
      <td><code>specialtyKey</code></td>
      <td>String</td>
      <td><code>item.specialtyKey</code></td>
      <td>Specialty Slug</td>
      <td>'general', 'cardio', 'ortho', etc.</td>
    </tr>
    <tr>
      <td><code>qualification</code></td>
      <td>String</td>
      <td><code>item.qualification</code></td>
      <td>Medical Degrees</td>
      <td>e.g. 'MBBS, MD (General Medicine)'</td>
    </tr>
    <tr>
      <td><code>experienceYears</code></td>
      <td>Number</td>
      <td><code>item.experienceYears</code></td>
      <td>Years of Clinical Practice</td>
      <td>e.g. 12</td>
    </tr>
    <tr>
      <td><code>experience</code></td>
      <td>String</td>
      <td><code>item.experience</code></td>
      <td>Display Text</td>
      <td>e.g. '12 Years Experience'</td>
    </tr>
    <tr>
      <td><code>rating</code></td>
      <td>Number</td>
      <td><code>item.rating</code></td>
      <td>Star Rating (0.0 to 5.0)</td>
      <td>Computed from patient reviews</td>
    </tr>
    <tr>
      <td><code>reviewCount</code></td>
      <td>Number</td>
      <td><code>item.reviewCount</code></td>
      <td>Total Reviews Count</td>
      <td>e.g. 380</td>
    </tr>
    <tr>
      <td><code>fee</code></td>
      <td>Number</td>
      <td><code>item.fee</code></td>
      <td>In-Clinic Consultation Fee (₹)</td>
      <td>e.g. 500</td>
    </tr>
    <tr>
      <td><code>videoConsultFee</code></td>
      <td>Number</td>
      <td><code>item.videoConsultFee</code></td>
      <td>Video Consultation Fee (₹)</td>
      <td>Configured per doctor</td>
    </tr>
    <tr>
      <td><code>clinicName</code></td>
      <td>String</td>
      <td><code>item.clinicName</code></td>
      <td>Affiliated Clinic / Hospital</td>
      <td>e.g. 'Unnathi Multispeciality Clinic'</td>
    </tr>
    <tr>
      <td><code>clinicArea</code></td>
      <td>String</td>
      <td><code>item.clinicArea</code></td>
      <td>Area / Locality</td>
      <td>e.g. 'Kuvempunagar, Mysore'</td>
    </tr>
    <tr>
      <td><code>clinicAddress</code></td>
      <td>String</td>
      <td><code>item.clinicAddress</code></td>
      <td>Full Physical Address</td>
      <td>Includes pincode</td>
    </tr>
    <tr>
      <td><code>distanceKm</code></td>
      <td>Number</td>
      <td><code>item.distanceKm</code></td>
      <td>Distance Metric</td>
      <td>Calculated from user GPS</td>
    </tr>
    <tr>
      <td><code>latitude</code></td>
      <td>Number</td>
      <td><code>item.latitude</code></td>
      <td>Map Latitude</td>
      <td>e.g. 12.2858</td>
    </tr>
    <tr>
      <td><code>longitude</code></td>
      <td>Number</td>
      <td><code>item.longitude</code></td>
      <td>Map Longitude</td>
      <td>e.g. 76.6341</td>
    </tr>
    <tr>
      <td><code>phone</code></td>
      <td>String</td>
      <td><code>item.phone</code></td>
      <td>Contact Phone</td>
      <td>Clinic landline or mobile</td>
    </tr>
    <tr>
      <td><code>openHours</code></td>
      <td>String</td>
      <td><code>item.openHours</code></td>
      <td>Consultation Hours</td>
      <td>e.g. '09:00 AM - 01:30 PM'</td>
    </tr>
    <tr>
      <td><code>availableToday</code></td>
      <td>Boolean</td>
      <td><code>item.availableToday</code></td>
      <td>Same-day Availability Flag</td>
      <td>True / False toggle</td>
    </tr>
    <tr>
      <td><code>nextSlot</code></td>
      <td>String</td>
      <td><code>item.nextSlot</code></td>
      <td>Next Earliest Slot</td>
      <td>e.g. 'Today, 04:30 PM'</td>
    </tr>
    <tr>
      <td><code>slots</code></td>
      <td>Array of Strings</td>
      <td><code>item.slots</code></td>
      <td>Available Time Slot Array</td>
      <td>['09:30 AM', '11:00 AM', '04:30 PM']</td>
    </tr>
    <tr>
      <td><code>image</code></td>
      <td>String (URL)</td>
      <td><code>item.image</code></td>
      <td>Doctor Photo URL</td>
      <td>High-res avatar URL</td>
    </tr>
    <tr>
      <td><code>about</code></td>
      <td>String</td>
      <td><code>item.about</code></td>
      <td>Doctor Bio & Clinical Focus</td>
      <td>Detailed biography</td>
    </tr>
    <tr>
      <td><code>servicesOffered</code></td>
      <td>Array of Strings</td>
      <td><code>item.servicesOffered</code></td>
      <td>List of Specific Treatments</td>
      <td>['General Consultation', 'Diabetes Care']</td>
    </tr>
    <tr>
      <td><code>badges</code></td>
      <td>Array of Strings</td>
      <td><code>item.badges</code></td>
      <td>Trust Badges</td>
      <td>['Verified Doctor', 'Quick Consultation']</td>
    </tr>
  </tbody>
</table>

<h3 class="sub-heading">2.4 Central Appointments & Bookings (<code>appointments</code> Collection / Table)</h3>
<table>
  <thead>
    <tr>
      <th style="width: 22%;">Database & App Field Name</th>
      <th style="width: 14%;">Data Type</th>
      <th style="width: 24%;">Patient App (<code>database.json</code>)</th>
      <th style="width: 22%;">Super Admin Oversight</th>
      <th style="width: 18%;">Allowed Values</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><code>id</code></td>
      <td>String (PK)</td>
      <td><code>appointment.id</code></td>
      <td>Appointment Booking Reference</td>
      <td>Format: <code>APT-xxxx</code></td>
    </tr>
    <tr>
      <td><code>userId</code></td>
      <td>String (FK)</td>
      <td><code>user.id</code></td>
      <td>Linked Patient Account</td>
      <td>Foreign key to <code>users.id</code></td>
    </tr>
    <tr>
      <td><code>patientName</code></td>
      <td>String</td>
      <td><code>appointment.patientName</code></td>
      <td>Patient Name at Booking</td>
      <td>Self or Family Member</td>
    </tr>
    <tr>
      <td><code>serviceType</code></td>
      <td>String</td>
      <td><code>appointment.serviceType</code></td>
      <td>Service Category Filter</td>
      <td>'doctor' | 'video' | 'nurse' | 'lab' | 'radiology'</td>
    </tr>
    <tr>
      <td><code>type</code></td>
      <td>String</td>
      <td><code>appointment.type</code></td>
      <td>Detailed Booking Type</td>
      <td>'In-Person Consultation' | 'Video Call'</td>
    </tr>
    <tr>
      <td><code>doctorId</code></td>
      <td>String (FK)</td>
      <td><code>doctor.id</code></td>
      <td>Assigned Doctor ID</td>
      <td>Foreign key to <code>doctors.id</code></td>
    </tr>
    <tr>
      <td><code>doctorName</code></td>
      <td>String</td>
      <td><code>appointment.doctorName</code></td>
      <td>Doctor Display Name</td>
      <td>e.g. 'Dr. Ramesh Kumar'</td>
    </tr>
    <tr>
      <td><code>specialty</code></td>
      <td>String</td>
      <td><code>appointment.specialty</code></td>
      <td>Doctor Specialty</td>
      <td>e.g. 'Cardiology'</td>
    </tr>
    <tr>
      <td><code>hospital</code></td>
      <td>String</td>
      <td><code>appointment.hospital</code></td>
      <td>Hospital / Clinic Name</td>
      <td>e.g. 'Apollo BGS Hospital, Mysore'</td>
    </tr>
    <tr>
      <td><code>date</code></td>
      <td>String</td>
      <td><code>appointment.date</code></td>
      <td>Appointment Date</td>
      <td>Format: YYYY-MM-DD</td>
    </tr>
    <tr>
      <td><code>time</code></td>
      <td>String</td>
      <td><code>appointment.time</code></td>
      <td>Appointment Time</td>
      <td>e.g. '10:30 AM'</td>
    </tr>
    <tr>
      <td><code>timeSlot</code></td>
      <td>String</td>
      <td><code>appointment.timeSlot</code></td>
      <td>Slot Range</td>
      <td>e.g. '10:00 AM - 11:00 AM'</td>
    </tr>
    <tr>
      <td><code>fee</code></td>
      <td>Number</td>
      <td><code>appointment.fee</code></td>
      <td>Consultation Fee Charged (₹)</td>
      <td>e.g. 650</td>
    </tr>
    <tr>
      <td><code>status</code></td>
      <td>String</td>
      <td><code>appointment.status</code></td>
      <td>Booking Lifecycle Status</td>
      <td>'Scheduled' | 'Confirmed' | 'Completed' | 'Cancelled'</td>
    </tr>
    <tr>
      <td><code>meetingLink</code></td>
      <td>String (URL)</td>
      <td><code>appointment.meetingLink</code></td>
      <td>Telemedicine Video Room Link</td>
      <td>WebRTC / Agora meeting URL</td>
    </tr>
  </tbody>
</table>

<div class="page-break"></div>

<h3 class="sub-heading">2.5 Pharmacy Orders & Fulfillment (<code>orders</code> Collection / Table)</h3>
<table>
  <thead>
    <tr>
      <th style="width: 22%;">Database & App Field Name</th>
      <th style="width: 14%;">Data Type</th>
      <th style="width: 24%;">Patient App (<code>database.json</code>)</th>
      <th style="width: 22%;">Super Admin & Pharmacy Desk</th>
      <th style="width: 18%;">Allowed Values</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><code>id</code></td>
      <td>String (PK)</td>
      <td><code>order.id</code></td>
      <td>Order ID</td>
      <td>Format: <code>ORD-xxxx</code></td>
    </tr>
    <tr>
      <td><code>userId</code></td>
      <td>String (FK)</td>
      <td><code>user.id</code></td>
      <td>Customer ID</td>
      <td>Foreign key to <code>users.id</code></td>
    </tr>
    <tr>
      <td><code>pharmacy</code></td>
      <td>String</td>
      <td><code>order.pharmacy</code></td>
      <td>Partner Retail Pharmacy Store</td>
      <td>e.g. 'Apollo Pharmacy - Kuvempunagar'</td>
    </tr>
    <tr>
      <td><code>items</code></td>
      <td>Array of Objects</td>
      <td><code>order.items</code></td>
      <td>Line Items List</td>
      <td><code>[{ name, qty, price }]</code></td>
    </tr>
    <tr>
      <td><code>total</code></td>
      <td>Number</td>
      <td><code>order.total</code></td>
      <td>Total Amount Paid (₹)</td>
      <td>e.g. 210</td>
    </tr>
    <tr>
      <td><code>date</code></td>
      <td>String</td>
      <td><code>order.date</code></td>
      <td>Order Date</td>
      <td>Format: YYYY-MM-DD</td>
    </tr>
    <tr>
      <td><code>status</code></td>
      <td>String</td>
      <td><code>order.status</code></td>
      <td>Fulfillment Stage</td>
      <td>'Placed' | 'RxApproved' | 'OutForDelivery' | 'Delivered' | 'Cancelled'</td>
    </tr>
    <tr>
      <td><code>deliveryAddress</code></td>
      <td>String</td>
      <td><code>order.deliveryAddress</code></td>
      <td>Delivery Destination Address</td>
      <td>Street, Area, Pincode</td>
    </tr>
    <tr>
      <td><code>deliveryPartnerName</code></td>
      <td>String</td>
      <td><code>order.deliveryPartnerName</code></td>
      <td>Assigned Delivery Driver</td>
      <td>Driver Full Name</td>
    </tr>
    <tr>
      <td><code>deliveryPartnerPhone</code></td>
      <td>String</td>
      <td><code>order.deliveryPartnerPhone</code></td>
      <td>Driver Phone</td>
      <td>Mobile Number</td>
    </tr>
    <tr>
      <td><code>otp</code></td>
      <td>String</td>
      <td><code>order.otp</code></td>
      <td>Delivery Verification OTP</td>
      <td>4-digit secret OTP</td>
    </tr>
  </tbody>
</table>

<h3 class="sub-heading">2.6 Diagnostic Lab Tests & Bookings (<code>labBookings</code> Collection / Table)</h3>
<table>
  <thead>
    <tr>
      <th style="width: 22%;">Database & App Field Name</th>
      <th style="width: 14%;">Data Type</th>
      <th style="width: 24%;">Patient App Source</th>
      <th style="width: 22%;">Lab Admin Management</th>
      <th style="width: 18%;">Allowed Values</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><code>id</code></td>
      <td>String (PK)</td>
      <td><code>labBooking.id</code></td>
      <td>Lab Booking ID</td>
      <td>Format: <code>LAB-xxxx</code></td>
    </tr>
    <tr>
      <td><code>userId</code></td>
      <td>String (FK)</td>
      <td><code>user.id</code></td>
      <td>Patient User ID</td>
      <td>Foreign key to <code>users.id</code></td>
    </tr>
    <tr>
      <td><code>patientName</code></td>
      <td>String</td>
      <td><code>labBooking.patientName</code></td>
      <td>Patient Name</td>
      <td>Name of person tested</td>
    </tr>
    <tr>
      <td><code>tests</code></td>
      <td>Array of Objects</td>
      <td><code>labBooking.tests</code></td>
      <td>Diagnostic Tests List</td>
      <td>CBC, Lipid Profile, Thyroid, etc.</td>
    </tr>
    <tr>
      <td><code>packageName</code></td>
      <td>String</td>
      <td><code>labBooking.packageName</code></td>
      <td>Package Title</td>
      <td>e.g. 'Comprehensive Full Body Checkup'</td>
    </tr>
    <tr>
      <td><code>collectionType</code></td>
      <td>String</td>
      <td><code>labBooking.collectionType</code></td>
      <td>Sample Mode</td>
      <td>'HomeSample' | 'CenterWalkIn'</td>
    </tr>
    <tr>
      <td><code>date</code></td>
      <td>String</td>
      <td><code>labBooking.date</code></td>
      <td>Collection Date</td>
      <td>Format: YYYY-MM-DD</td>
    </tr>
    <tr>
      <td><code>timeSlot</code></td>
      <td>String</td>
      <td><code>labBooking.timeSlot</code></td>
      <td>Sample Collection Slot</td>
      <td>e.g. '07:00 AM - 08:30 AM'</td>
    </tr>
    <tr>
      <td><code>fee</code></td>
      <td>Number</td>
      <td><code>labBooking.fee</code></td>
      <td>Total Amount (₹)</td>
      <td>Numerical INR</td>
    </tr>
    <tr>
      <td><code>status</code></td>
      <td>String</td>
      <td><code>labBooking.status</code></td>
      <td>Diagnostic Status</td>
      <td>'Booked' | 'SampleCollected' | 'Testing' | 'ReportReady'</td>
    </tr>
    <tr>
      <td><code>phlebotomistName</code></td>
      <td>String</td>
      <td><code>labBooking.phlebotomistName</code></td>
      <td>Assigned Phlebotomist</td>
      <td>Staff Name</td>
    </tr>
    <tr>
      <td><code>reportUrl</code></td>
      <td>String (URL)</td>
      <td><code>labBooking.reportUrl</code></td>
      <td>Published PDF Report URL</td>
      <td>Syncs directly to Health Vault</td>
    </tr>
  </tbody>
</table>

<h3 class="sub-heading">2.7 Radiology Scans & Imaging Centers (<code>radiologyBookings</code> Collection / Table)</h3>
<table>
  <thead>
    <tr>
      <th style="width: 22%;">Database & App Field Name</th>
      <th style="width: 14%;">Data Type</th>
      <th style="width: 24%;">Patient App (<code>radiologyLabsData.js</code>)</th>
      <th style="width: 22%;">Radiology Admin Oversight</th>
      <th style="width: 18%;">Allowed Values</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><code>id</code></td>
      <td>String (PK)</td>
      <td><code>booking.id</code></td>
      <td>Scan Booking Reference</td>
      <td>Format: <code>RAD-xxxx</code></td>
    </tr>
    <tr>
      <td><code>userId</code></td>
      <td>String (FK)</td>
      <td><code>user.id</code></td>
      <td>Patient Account ID</td>
      <td>Foreign key to <code>users.id</code></td>
    </tr>
    <tr>
      <td><code>labId</code></td>
      <td>String (FK)</td>
      <td><code>lab.id</code></td>
      <td>Imaging Center ID</td>
      <td>e.g. <code>lab-unnathi-main</code></td>
    </tr>
    <tr>
      <td><code>labName</code></td>
      <td>String</td>
      <td><code>lab.name</code></td>
      <td>Center Display Name</td>
      <td>e.g. 'Unnathi Advanced Diagnostics & 3T MRI'</td>
    </tr>
    <tr>
      <td><code>testId</code></td>
      <td>String</td>
      <td><code>test.id</code></td>
      <td>Scan Procedure Code</td>
      <td>e.g. <code>RAD-UNN-01</code></td>
    </tr>
    <tr>
      <td><code>testName</code></td>
      <td>String</td>
      <td><code>test.name</code></td>
      <td>Procedure Name</td>
      <td>e.g. 'MRI Brain (Plain + Contrast)'</td>
    </tr>
    <tr>
      <td><code>modalityCode</code></td>
      <td>String</td>
      <td><code>test.modalityCode</code></td>
      <td>Machine Modality Type</td>
      <td>'3T MRI' | '128-Slice CT' | '4D Ultrasound' | 'Digital X-Ray'</td>
    </tr>
    <tr>
      <td><code>date</code></td>
      <td>String</td>
      <td><code>booking.date</code></td>
      <td>Scheduled Date</td>
      <td>Format: YYYY-MM-DD</td>
    </tr>
    <tr>
      <td><code>timeSlot</code></td>
      <td>String</td>
      <td><code>booking.timeSlot</code></td>
      <td>Scan Slot Time</td>
      <td>e.g. '11:00 AM - 11:45 AM'</td>
    </tr>
    <tr>
      <td><code>fee</code></td>
      <td>Number</td>
      <td><code>test.price</code></td>
      <td>Discounted Fee Paid (₹)</td>
      <td>e.g. 4999</td>
    </tr>
    <tr>
      <td><code>status</code></td>
      <td>String</td>
      <td><code>booking.status</code></td>
      <td>Radiology Status</td>
      <td>'Booked' | 'SlotConfirmed' | 'ScanDone' | 'ReportAvailable'</td>
    </tr>
    <tr>
      <td><code>reportUrl</code></td>
      <td>String (URL)</td>
      <td><code>booking.reportUrl</code></td>
      <td>Official Radiologist PDF</td>
      <td>Signed PDF Report URL</td>
    </tr>
  </tbody>
</table>

<div class="page-break"></div>

<h3 class="sub-heading">2.8 Home Nursing, Medical Equipment, IVF & Emergency Records</h3>
<table>
  <thead>
    <tr>
      <th style="width: 18%;">Module / Collection</th>
      <th style="width: 22%;">Identical Key Names</th>
      <th style="width: 14%;">Data Types</th>
      <th style="width: 24%;">Patient App Reference</th>
      <th style="width: 22%;">Admin Desk Handling</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><code>nurseBookings</code></td>
      <td><code>id, userId, patientName, serviceName, nurseName, plan, startDate, endDate, timeSlot, address, status, fee</code></td>
      <td>String, Number</td>
      <td><code>database.json -> appointments (serviceType: nurse)</code></td>
      <td>Home Care Supervisor manages staff nurse allocation, patient vitals, and visit reviews.</td>
    </tr>
    <tr>
      <td><code>equipmentRentals</code></td>
      <td><code>id, userId, patientName, equipmentName, dailyRate, durationDays, depositAmount, deliveryAddress, status</code></td>
      <td>String, Number</td>
      <td><code>EquipmentRentalScreen.js</code></td>
      <td>Equipment Vendor Admin tracks bed/oxygen concentrator stock, security deposit, and pickup.</td>
    </tr>
    <tr>
      <td><code>fertilityJourneys</code></td>
      <td><code>id, userId, coupleName, clinicName, treatmentType, currentStage, coordinatorName, emiPlan, consentFormUrls</code></td>
      <td>String, Array</td>
      <td><code>FertilityIvfScreen.js, IVFJourneyScreen.js</code></td>
      <td>Fertility Coordinator tracks IVF cycle steps (Stimulation, Retrieval, Transfer), consents, and EMI loans.</td>
    </tr>
    <tr>
      <td><code>ambulanceDispatches</code></td>
      <td><code>id, userId, patientName, patientPhone, callerLocation, ambulanceId, driverName, driverPhone, hospital, status</code></td>
      <td>String, Object</td>
      <td><code>AmbulanceScreen.js, EmergencyModal</code></td>
      <td>24/7 SOS Dispatcher handles live audio alarm, sends nearest ambulance, notifies destination ER.</td>
    </tr>
    <tr>
      <td><code>walletTransactions</code></td>
      <td><code>id, userId, title, type, amount, date, status, gatewayRef</code></td>
      <td>String, Number</td>
      <td><code>database.json -> walletTransactions</code></td>
      <td>Finance Admin reviews wallet top-ups, promotional bonuses, cashbacks, and refund disputes.</td>
    </tr>
  </tbody>
</table>

<div class="page-break"></div>

<h3 class="sub-heading">2.9 Concrete JSON Payload Examples (Exact Key-Value Pairs Stored in Database)</h3>
<p>These JSON objects represent the exact format expected by both the Patient App (via <code>dataSyncService.js</code> / <code>database.json</code>) and the Super Admin Portal:</p>

<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 8px;">

<div>
  <div style="font-weight: 800; color: #0F766E; font-size: 8pt; margin-bottom: 3px;">A. Patient Profile Record (<code>users</code>)</div>
  <pre style="background: #0F172A; color: #E2E8F0; padding: 8px; border-radius: 6px; font-size: 6.8pt; line-height: 1.35; overflow: hidden; font-family: Consolas, monospace;"><code>{
  "id": "PAT-1001",
  "name": "Rajesh Sharma",
  "email": "rajesh.sharma@example.com",
  "phone": "+91 98450 12345",
  "password": "$2b$10$hashedpass...",
  "gender": "Male",
  "age": "42 Yrs",
  "city": "Mysore",
  "bloodGroup": "O+ Positive",
  "dob": "15/08/1984",
  "emergencyContact": "+91 98450 99999 (Brother)",
  "address": "45, 4th Main, Kuvempunagar, Mysore",
  "walletBalance": 1250,
  "carePoints": 500,
  "isVipMember": true,
  "vipExpiryDate": "2027-09-19T00:00:00Z",
  "abhaId": "14-9845-0123-4567"
}</code></pre>
</div>

<div>
  <div style="font-weight: 800; color: #0F766E; font-size: 8pt; margin-bottom: 3px;">B. Doctor Master Record (<code>doctors</code>)</div>
  <pre style="background: #0F172A; color: #E2E8F0; padding: 8px; border-radius: 6px; font-size: 6.8pt; line-height: 1.35; overflow: hidden; font-family: Consolas, monospace;"><code>{
  "id": "1",
  "name": "Dr. Ananya Rao",
  "specialty": "General Physician",
  "specialtyKey": "general",
  "qualification": "MBBS, MD (General Medicine)",
  "experienceYears": 12,
  "experience": "12 Years Experience",
  "rating": 4.9,
  "reviewCount": 380,
  "fee": 500,
  "videoConsultFee": 400,
  "clinicName": "Unnathi Multispeciality Clinic",
  "clinicArea": "Kuvempunagar, Mysore",
  "clinicAddress": "No. 24, 5th Cross, Mysore - 570023",
  "distanceKm": 0.8,
  "latitude": 12.2858,
  "longitude": 76.6341,
  "phone": "+91 821 245 9901",
  "openHours": "09:00 AM - 01:30 PM",
  "availableToday": true,
  "nextSlot": "Today, 04:30 PM",
  "slots": ["09:30 AM", "11:00 AM", "04:30 PM"],
  "image": "https://images.unsplash.com/...",
  "about": "Renowned consultant physician..."
}</code></pre>
</div>

<div>
  <div style="font-weight: 800; color: #0F766E; font-size: 8pt; margin-bottom: 3px;">C. Appointment Record (<code>appointments</code>)</div>
  <pre style="background: #0F172A; color: #E2E8F0; padding: 8px; border-radius: 6px; font-size: 6.8pt; line-height: 1.35; overflow: hidden; font-family: Consolas, monospace;"><code>{
  "id": "APT-9001",
  "userId": "PAT-1001",
  "patientName": "Rajesh Sharma",
  "serviceType": "doctor",
  "type": "In-Person Consultation",
  "doctorId": "1",
  "doctorName": "Dr. Ramesh Kumar",
  "specialty": "Cardiology",
  "hospital": "Apollo BGS Hospital, Mysore",
  "date": "2026-09-12",
  "time": "10:30 AM",
  "timeSlot": "10:00 AM - 11:00 AM",
  "fee": 650,
  "paymentMethod": "wallet",
  "paymentStatus": "Paid",
  "status": "Confirmed",
  "meetingLink": "https://video.mediunify.com/APT-9001"
}</code></pre>
</div>

<div>
  <div style="font-weight: 800; color: #0F766E; font-size: 8pt; margin-bottom: 3px;">D. Pharmacy Order Record (<code>orders</code>)</div>
  <pre style="background: #0F172A; color: #E2E8F0; padding: 8px; border-radius: 6px; font-size: 6.8pt; line-height: 1.35; overflow: hidden; font-family: Consolas, monospace;"><code>{
  "id": "ORD-5501",
  "userId": "PAT-1001",
  "patientName": "Rajesh Sharma",
  "pharmacy": "Apollo Pharmacy - Kuvempunagar",
  "pharmacyId": "PHARM-MYS-01",
  "items": [
    { "id": "MED-01", "name": "Paracetamol 650mg", "qty": 2, "price": 45 },
    { "id": "MED-02", "name": "Vitamin C 500mg", "qty": 1, "price": 120 }
  ],
  "total": 210,
  "discount": 0,
  "deliveryFee": 0,
  "date": "2026-09-07",
  "deliveryAddress": "45, 4th Main, Kuvempunagar",
  "status": "Delivered",
  "deliveryPartnerName": "Suresh Kumar",
  "otp": "4821"
}</code></pre>
</div>

</div>

<!-- SECTION 3 -->
<h2 class="sec-heading">3. End-to-End Operational Workflows (Patient App ➔ Database ➔ Admin)</h2>

<div class="flow-grid">
  <div class="flow-card">
    <div class="flow-card-title">1. Doctor In-Clinic / Video Booking</div>
    Patient books slot in app ➔ Saved to <code>appointments</code> with status <code>'Confirmed'</code> ➔ Doctor Admin sees live appointment queue ➔ Video room link generated ➔ Completed ➔ Rx uploaded.
  </div>
  <div class="flow-card">
    <div class="flow-card-title">2. Doorstep Pharmacy Order</div>
    Patient adds medicines to cart ➔ Uploads Rx ➔ Rx Pharmacist verifies matching drugs ➔ Routed to closest partner pharmacy ➔ Delivery agent dispatched with OTP ➔ Status marked <code>'Delivered'</code>.
  </div>
  <div class="flow-card">
    <div class="flow-card-title">3. Diagnostic Pathology Sample</div>
    Patient selects test package ➔ Chooses morning slot ➔ Phlebotomy Dispatcher assigns field phlebotomist ➔ Barcode sample scanned ➔ Lab testing ➔ Pathologist signs off PDF ➔ Syncs to patient vault.
  </div>
  <div class="flow-card">
    <div class="flow-card-title">4. Emergency SOS Dispatch</div>
    Patient taps "Ambulance SOS" ➔ High-priority WebSocket alert triggers on Admin console ➔ Nearest ALS/BLS ambulance dispatched ➔ Hospital casualty pre-alerted with bed pre-booking.
  </div>
</div>

<!-- SECTION 4 -->
<h2 class="sec-heading">4. Technical Architecture, Security & Implementation Stack</h2>

<div class="callout callout-warning">
  <strong>Data Integrity Principle:</strong> The Admin Portal and Patient App must never use diverging schemas. Any column added to the patient app must be mirrored in the Super Admin system using the identical camelCase name.
</div>

<ul style="margin-left: 18px; margin-top: 8px; font-size: 8.5pt; color: #334155;">
  <li><strong>Admin Portal Framework:</strong> Next.js 14 / React 19 web application hosted on secure sub-domain (e.g., <code>admin.mediunify.com</code>).</li>
  <li><strong>API Gateway & Authentication:</strong> Node.js / Express backend with JWT tokens, refresh tokens, role-based middleware guards, and mandatory 2FA (SMS OTP or TOTP Authenticator).</li>
  <li><strong>Audit Trail Logger:</strong> Immutable append-only audit ledger recording every read, write, or export action performed on patient medical histories in compliance with DISHA (Digital Information Security in Healthcare Act).</li>
  <li><strong>Real-time Layer:</strong> WebSockets (Socket.io) powering live ambulance GPS movement, urgent video call requests, and real-time pharmacy delivery statuses.</li>
</ul>

<div style="margin-top: 25px; padding-top: 10px; border-top: 1px solid #CBD5E1; display: flex; justify-content: space-between; font-size: 8pt; color: #64748b;">
  <div>MediUnify Healthcare Platform — Super Admin System Specification</div>
  <div>Generated on: September 19, 2026 • Mysore & Bengaluru Operations</div>
</div>

</body>
</html>
`;

const htmlFilePath = path.join(__dirname, 'admin_superadmin_spec.html');
const pdfFilePathProject = path.join(__dirname, '..', 'MediUnify_Admin_SuperAdmin_Architecture_and_Database_Specification.pdf');
const pdfFilePathRoot = path.join(__dirname, '..', '..', 'MediUnify_Admin_SuperAdmin_Architecture_and_Database_Specification.pdf');

fs.writeFileSync(htmlFilePath, htmlContent);

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const browserBin = fs.existsSync(chromePath) ? chromePath : edgePath;

console.log('Using browser:', browserBin);
console.log('Generating PDF...');

try {
  execSync(`"${browserBin}" --headless --disable-gpu --run-all-compositor-stages-before-draw --print-to-pdf="${pdfFilePathProject}" "${htmlFilePath}"`);
  console.log('✅ PDF generated successfully at:', pdfFilePathProject);
  console.log('File size:', fs.statSync(pdfFilePathProject).size, 'bytes');
  
  // Also copy to root workspace
  fs.copyFileSync(pdfFilePathProject, pdfFilePathRoot);
  console.log('✅ Copied to root workspace:', pdfFilePathRoot);
  
  fs.unlinkSync(htmlFilePath);
} catch (err) {
  console.error('Error generating PDF:', err);
}

