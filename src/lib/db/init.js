import { executeQuery } from './mysql.js'

const createTables = async () => {
  const tables = [
    // Users table
    `CREATE TABLE IF NOT EXISTS users (
      id INT PRIMARY KEY AUTO_INCREMENT,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      role ENUM('super_admin', 'connector', 'operator', 'banker') NOT NULL,
      status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_email (email),
      INDEX idx_role (role),
      INDEX idx_status (status)
    )`,

    // User profiles table
    `CREATE TABLE IF NOT EXISTS user_profiles (
      id INT PRIMARY KEY AUTO_INCREMENT,
      user_id INT NOT NULL,
      first_name VARCHAR(100) NOT NULL,
      last_name VARCHAR(100) NOT NULL,
      phone VARCHAR(20),
      address TEXT,
      city VARCHAR(100),
      state VARCHAR(100),
      pincode VARCHAR(10),
      aadhar_number VARCHAR(12),
      pan_number VARCHAR(10),
      profile_image VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_user_id (user_id),
      INDEX idx_aadhar (aadhar_number),
      INDEX idx_pan (pan_number)
    )`,

    // Connectors table
    `CREATE TABLE IF NOT EXISTS connectors (
      id INT PRIMARY KEY AUTO_INCREMENT,
      user_id INT NOT NULL,
      agent_code VARCHAR(50) UNIQUE NOT NULL,
      city VARCHAR(100) NOT NULL,
      area VARCHAR(100) NOT NULL,
      commission_percentage DECIMAL(5,2) DEFAULT 0.00,
      total_cases_submitted INT DEFAULT 0,
      total_approved_cases INT DEFAULT 0,
      total_commission_earned DECIMAL(15,2) DEFAULT 0.00,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_agent_code (agent_code),
      INDEX idx_city (city)
    )`,

    // Loan categories table
    `CREATE TABLE IF NOT EXISTS loan_categories (
      id INT PRIMARY KEY AUTO_INCREMENT,
      name VARCHAR(100) NOT NULL,
      description TEXT,
      min_amount DECIMAL(15,2),
      max_amount DECIMAL(15,2),
      interest_rate_min DECIMAL(5,2),
      interest_rate_max DECIMAL(5,2),
      max_tenure_months INT,
      status ENUM('active', 'inactive') DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_status (status)
    )`,

    // Customers table
    `CREATE TABLE IF NOT EXISTS customers (
      id INT PRIMARY KEY AUTO_INCREMENT,
      connector_id INT NOT NULL,
      first_name VARCHAR(100) NOT NULL,
      last_name VARCHAR(100) NOT NULL,
      email VARCHAR(255),
      phone VARCHAR(20) NOT NULL,
      date_of_birth DATE,
      gender ENUM('male', 'female', 'other'),
      marital_status ENUM('single', 'married', 'divorced', 'widowed'),
      address TEXT NOT NULL,
      city VARCHAR(100) NOT NULL,
      state VARCHAR(100) NOT NULL,
      pincode VARCHAR(10) NOT NULL,
      aadhar_number VARCHAR(12) UNIQUE NOT NULL,
      pan_number VARCHAR(10) UNIQUE NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_connector_id (connector_id),
      INDEX idx_aadhar (aadhar_number),
      INDEX idx_pan (pan_number),
      INDEX idx_email (email)
    )`,

    // Loan applications table
    `CREATE TABLE IF NOT EXISTS loan_applications (
      id INT PRIMARY KEY AUTO_INCREMENT,
      application_number VARCHAR(50) UNIQUE NOT NULL,
      customer_id INT NOT NULL,
      connector_id INT NOT NULL,
      loan_category_id INT NOT NULL,
      requested_amount DECIMAL(15,2) NOT NULL,
      approved_amount decimal(15,2) DEFAULT NULL,
      approved_interest_rate decimal(5,2) DEFAULT NULL,
      approved_tenure_months int DEFAULT NULL,
      disbursed_amount decimal(15,2) DEFAULT NULL,
      disbursed_at timestamp NULL DEFAULT NULL,
      disbursement_details json DEFAULT NULL,
      banker_remarks text,
      special_conditions text,
      approved_by int DEFAULT NULL,
      approved_at timestamp NULL DEFAULT NULL,
      selected_offer_id INT NULL,
      marketplace_status ENUM('not_distributed', 'distributed', 'offers_received', 'offer_selected', 'finalized') DEFAULT 'not_distributed',
      purpose TEXT NOT NULL,
      monthly_income DECIMAL(12,2) NOT NULL,
      employment_type ENUM('salaried', 'self_employed', 'business', 'other') NOT NULL,
      company_name VARCHAR(200),
      work_experience_years INT,
      existing_loans_amount DECIMAL(15,2) DEFAULT 0.00,
      status ENUM('submitted', 'under_verification', 'verified', 'sent_to_bankers', 'approved', 'rejected', 'disbursed', 'document_rejected', 'document_requested', 'partially_disbursed') DEFAULT 'submitted',
      cibil_score INT,
      cibil_report_url VARCHAR(255),
      operator_remarks TEXT,
      special_instructions TEXT,
      vehicle_reg_number VARCHAR(15) DEFAULT NULL,
      vehicle_valuation INT DEFAULT NULL,
      vehicle_km INT DEFAULT NULL,
      vehicle_owner INT DEFAULT NULL,
      comission_amount VARCHAR(10) DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_application_number (application_number),
      INDEX idx_status (status),
      INDEX idx_connector_id (connector_id),
      INDEX idx_created_at (created_at)
    )`,

    // Document types table
    `CREATE TABLE IF NOT EXISTS document_types (
      id INT PRIMARY KEY AUTO_INCREMENT,
      name VARCHAR(100) NOT NULL,
      description TEXT,
      is_required BOOLEAN DEFAULT true,
      max_file_size_mb INT DEFAULT 5,
      is_pdd BOOLEAN DEFAULT false,
      allowed_formats VARCHAR(255) DEFAULT 'pdf,jpg,jpeg,png',
      is_active INT NOT NULL DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_required (is_required)
    )`,

    // Customer documents table
    `CREATE TABLE IF NOT EXISTS customer_documents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    loan_application_id INT NULL,
    customer_id INT NOT NULL,
    document_type_id INT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size_kb INT DEFAULT NULL,
    verification_status ENUM('pending', 'verified', 'rejected') DEFAULT 'pending',
    operator_remarks TEXT,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    verified_at TIMESTAMP NULL,
    verified_by INT NULL,
    rejection_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_loan_application (loan_application_id),
    INDEX idx_customer (customer_id),
    INDEX idx_document_type (document_type_id),
    INDEX idx_verification_status (verification_status)
  )`,

    // Banks table
    `CREATE TABLE IF NOT EXISTS banks (
      id INT PRIMARY KEY AUTO_INCREMENT,
      name VARCHAR(100) NOT NULL,
      code VARCHAR(20) UNIQUE NOT NULL,
      description TEXT,
      logo_url VARCHAR(255),
      contact_email VARCHAR(100),
      contact_phone VARCHAR(15),
      website VARCHAR(100),
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )`,

    // Bankers table
    `CREATE TABLE IF NOT EXISTS bankers (
      id INT PRIMARY KEY AUTO_INCREMENT,
      user_id INT NOT NULL,
      bank_id INT NOT NULL,
      branch VARCHAR(255) NOT NULL,
      branch_code VARCHAR(50) NOT NULL,
      city VARCHAR(50) NOT NULL,
      state VARCHAR(50) NOT NULL,
      pincode INT NOT NULL,
      employee_id VARCHAR(50),
      designation VARCHAR(100),
      department VARCHAR(100),
      loan_categories JSON,
      max_approval_limit DECIMAL(15,2),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_user_id (user_id),
      INDEX idx_bank_id (bank_id)
    )`,

    //application distributions
    `CREATE TABLE IF NOT EXISTS application_distributions (
        id INT PRIMARY KEY AUTO_INCREMENT,
        loan_application_id INT NOT NULL,
        bank_id INT NOT NULL,
        banker_user_id INT NOT NULL,
        operator_user_id INT NOT NULL,
        
        status ENUM('sent', 'viewed', 'offer_received', 'declined') DEFAULT 'sent',
        sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        viewed_at TIMESTAMP NULL,
        response_due_date DATETIME NOT NULL,
        
        notes TEXT
    )`,
    // Loan offers table
    `CREATE TABLE IF NOT EXISTS loan_offers (
        id INT PRIMARY KEY AUTO_INCREMENT,
        loan_application_id INT NOT NULL,
        bank_id INT NOT NULL,
        banker_user_id INT NOT NULL,
        
        -- Offer details
        offered_amount DECIMAL(12,2) NOT NULL,
        interest_rate DECIMAL(5,2) NOT NULL,
        tenure_months INT NOT NULL,
        processing_fee DECIMAL(10,2) DEFAULT 0,
        
        -- Additional terms (calculated fields)
        monthly_emi DECIMAL(10,2) GENERATED ALWAYS AS (
            (offered_amount * (interest_rate / 1200)) / 
            (1 - POW(1 + (interest_rate / 1200), -tenure_months))
        ) VIRTUAL,
        
        total_interest DECIMAL(12,2) GENERATED ALWAYS AS (
            (monthly_emi * tenure_months) - offered_amount
        ) VIRTUAL,
        
        total_payable DECIMAL(12,2) GENERATED ALWAYS AS (
            monthly_emi * tenure_months
        ) VIRTUAL,
        
        -- Offer status
        status ENUM('pending', 'active', 'selected', 'rejected', 'expired') DEFAULT 'active',
        valid_until DATETIME NOT NULL,
        
        -- Additional info
        terms_conditions TEXT,
        special_features TEXT,
        remarks TEXT,
        
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`,

    // Loan disbursements table
    `CREATE TABLE IF NOT EXISTS loan_disbursements (
      id INT PRIMARY KEY AUTO_INCREMENT,
      loan_application_id INT NOT NULL,
      loan_offer_id INT NOT NULL,
      disbursed_amount DECIMAL(15,2) NOT NULL,
      disbursement_date DATE NOT NULL,
      reference_number VARCHAR(100) UNIQUE NOT NULL,
      bank_reference VARCHAR(100),
      disbursement_method ENUM('bank_transfer', 'cheque', 'cash') DEFAULT 'bank_transfer',
      connector_commission DECIMAL(10,2) NOT NULL,
      commission_status ENUM('pending', 'paid') DEFAULT 'pending',
      disbursed_by INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_reference_number (reference_number),
      INDEX idx_commission_status (commission_status)
    )`,

    // Commission payments table
    `CREATE TABLE IF NOT EXISTS commission_payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    payment_reference VARCHAR(255) NOT NULL UNIQUE,
    payment_method ENUM('bank_transfer', 'upi', 'cheque', 'cash') NOT NULL,
    total_amount DECIMAL(15,2) NOT NULL,
    commission_count INT NOT NULL,
    payment_date DATE NOT NULL,
    paid_by INT NOT NULL,
    remarks TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_payment_reference (payment_reference),
    INDEX idx_payment_date (payment_date),
    INDEX idx_paid_by (paid_by)
  )`,

    // System logs table
    `CREATE TABLE IF NOT EXISTS system_logs (
      id INT PRIMARY KEY AUTO_INCREMENT,
      user_id INT,
      action VARCHAR(200) NOT NULL,
      entity_type VARCHAR(100),
      entity_id INT,
      old_values JSON,
      new_values JSON,
      ip_address VARCHAR(45),
      user_agent TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_user_id (user_id),
      INDEX idx_action (action),
      INDEX idx_created_at (created_at)
    )`,
    `CREATE TABLE IF NOT EXISTS commission_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    connector_id INT NOT NULL,
    loan_application_id INT NOT NULL,
    commission_amount DECIMAL(15,2) NOT NULL,
    commission_percentage DECIMAL(5,2) NOT NULL,
    status ENUM('earned', 'paid', 'pending') DEFAULT 'earned',
    paid_at TIMESTAMP NULL,
    paid_by INT NULL,
    payment_reference VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_connector (connector_id),
    INDEX idx_loan_application (loan_application_id),
    INDEX idx_status (status)
  )`,
    // Cities table
    `CREATE TABLE IF NOT EXISTS cities (
      id INT PRIMARY KEY AUTO_INCREMENT,
      name VARCHAR(100) NOT NULL,
      state VARCHAR(100) NOT NULL,
      pincode VARCHAR(6) NOT NULL
    )`,
    // RTO Agents table
    `CREATE TABLE IF NOT EXISTS rto_agents (
      id INT PRIMARY KEY AUTO_INCREMENT,
      name VARCHAR(100) NOT NULL,
      phone VARCHAR(20) NOT NULL,
      city VARCHAR(100) NOT NULL,
      is_active TINYINT(1) DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`,
    // Post Disbursement Cases table
    `CREATE TABLE IF NOT EXISTS post_disbursement_cases (
      id INT PRIMARY KEY AUTO_INCREMENT,
      loan_application_id INT NOT NULL UNIQUE,
      rto_agent_id INT DEFAULT NULL,
      status ENUM('pending', 'agent_assigned', 'rto_process_started', 'documents_pending', 'completed') DEFAULT 'pending',
      rc_number VARCHAR(50) DEFAULT NULL,
      rc_status ENUM('pending', 'received', 'handed_over') DEFAULT 'pending',
      remarks TEXT,
      assigned_at TIMESTAMP NULL DEFAULT NULL,
      completed_at TIMESTAMP NULL DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_loan_application_id (loan_application_id),
      INDEX idx_rto_agent_id (rto_agent_id)
    )`
  ]

  try {
    //console.log('🚀 Starting database initialization...')

    for (let i = 0; i < tables.length; i++) {
      await executeQuery(tables[i])
      //console.log(`✅ Table ${i + 1}/${tables.length} created successfully`)
    }

    //console.log('📦 Creating initial data...')
    await insertInitialData()

    //console.log('✅ Database initialization completed successfully!')

  } catch (error) {
    console.error('❌ Database initialization failed:', error)
    throw error
  }
}

const insertInitialData = async () => {
  // Insert default document types
  const documentTypes = [
    ['Aadhar Card', 'Government issued identity proof', true, 5],
    ['PAN Card', 'Permanent Account Number card', true, 5],
    ['Income Certificate/Salary Slips', 'Latest 3 months salary slips or income proof', true, 10],
    ['Bank Statement', 'Last 6 months bank statement', true, 10],
    ['Form 16', 'Income tax document for salaried individuals', false, 5],
    ['ITR Returns', 'Income Tax Returns for last 2 years', false, 10],
    ['Business Registration', 'Business registration documents for self-employed', false, 5],
    ['Property Documents', 'For secured loans', false, 15],
    ['Employment Certificate', 'Employment verification letter', false, 15],
    ['Business Registration', 'Business license or registration', false, 15],
    ['Address Proof', 'Utility bill or rent agreement', true, 15],
    ['RC Copy', 'Vehicle Registration Certificate', false, 5],
    ['Insurance Policy', 'Vehicle Insurance Policy', false, 5],
    ['RC Smart Card', 'Vehicle Registration Certificate Copy', false, 5],
    ['RTO Receipt', 'Tax or Fee Receipt from RTO', false, 5],
    ['Loan Closure Letter', 'Bank NOC or Closure Letter', false, 5]
  ]

  for (const docType of documentTypes) {
    await executeQuery(
      'INSERT IGNORE INTO document_types (name, description, is_required, max_file_size_mb) VALUES (?, ?, ?, ?)',
      docType
    )
  }

  // Insert default loan categories
  const loanCategories = [
    ['Personal Loan', 'Unsecured personal loans', 25000.00, 2000000.00, 10.50, 24.00, 84],
    ['Home Loan', 'Secured home loans', 500000.00, 50000000.00, 8.50, 12.00, 360],
    ['Auto Loan', 'Vehicle financing', 100000.00, 5000000.00, 7.50, 15.00, 84],
    ['Business Loan', 'Loans for business purposes', 50000.00, 10000000.00, 11.00, 20.00, 120],
    ['Education Loan', 'Higher education financing', 50000.00, 7500000.00, 9.50, 15.00, 180],
    ['Used Auto Loan', 'Vehicle financing for used vehicles', 100000.00, 5000000.00, 7.50, 15.00, 84]
  ]

  for (const category of loanCategories) {
    await executeQuery(
      'INSERT IGNORE INTO loan_categories (name, description, min_amount, max_amount, interest_rate_min, interest_rate_max, max_tenure_months) VALUES (?, ?, ?, ?, ?, ?, ?)',
      category
    )
  }

  // Insert sample banks
  const banks = [
    ['State Bank of India', 'SBI', 'India\'s largest public sector bank', 'sbi@bank.com', '1800-123-456'],
    ['HDFC Bank', 'HDFC', 'Leading private sector bank', 'hdfc@bank.com', '1800-123-457'],
    ['ICICI Bank', 'ICICI', 'Premium private bank', 'icici@bank.com', '1800-123-458'],
    ['Axis Bank', 'AXIS', 'Modern banking solutions', 'axis@bank.com', '1800-123-459'],
    ['Kotak Mahindra Bank', 'KOTAK', 'Innovative banking', 'kotak@bank.com', '1800-123-460']
  ]

  for (const bank of banks) {
    await executeQuery(
      'INSERT IGNORE INTO banks (name, code, description, contact_email, contact_phone) VALUES (?, ?, ?, ?, ?)',
      bank
    )
  }


}


export { createTables }
