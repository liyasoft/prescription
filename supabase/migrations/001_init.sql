-- 处方主表
CREATE TABLE prescriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prescription_no VARCHAR(50) UNIQUE NOT NULL,
    prescribe_date TIMESTAMP NOT NULL,
    dispense_date TIMESTAMP,
    type VARCHAR(20) NOT NULL,
    patient_name VARCHAR(50) NOT NULL,
    gender VARCHAR(10),
    age VARCHAR(20),
    weight VARCHAR(20),
    department VARCHAR(50) NOT NULL,
    diagnosis TEXT,
    phone VARCHAR(20),
    dispense_window VARCHAR(50),
    prepare_window VARCHAR(50),
    print_flag VARCHAR(20),
    remark TEXT,
    status VARCHAR(20),
    created_at TIMESTAMP DEFAULT now()
);

-- 处方药品明细表
CREATE TABLE prescription_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prescription_id UUID NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,
    drug_name VARCHAR(200) NOT NULL,
    drug_spec VARCHAR(200),
    manufacturer VARCHAR(200),
    batch_no VARCHAR(100),
    expiry_date VARCHAR(50),
    supplier VARCHAR(200),
    dispense_qty VARCHAR(50),
    prescription_doses VARCHAR(50),
    single_dose VARCHAR(50),
    single_dose_unit VARCHAR(20),
    retail_price DECIMAL(10,2),
    subtotal DECIMAL(10,2),
    stock_qty INTEGER,
    trade_name VARCHAR(200),
    insurance_level VARCHAR(20),
    usage_method VARCHAR(50),
    frequency VARCHAR(50),
    skin_test VARCHAR(20),
    doctor_advice TEXT,
    created_at TIMESTAMP DEFAULT now()
);

-- 审查会话表
CREATE TABLE review_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reviewer_name VARCHAR(50) NOT NULL,
    target_count INTEGER NOT NULL,
    actual_count INTEGER DEFAULT 0,
    pass_count INTEGER DEFAULT 0,
    fail_count INTEGER DEFAULT 0,
    filter_start_date DATE,
    filter_end_date DATE,
    filter_department VARCHAR(50),
    status VARCHAR(20) NOT NULL DEFAULT 'in_progress',
    started_at TIMESTAMP DEFAULT now(),
    finished_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT now()
);

-- 审查记录表
CREATE TABLE review_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES review_sessions(id) ON DELETE CASCADE,
    prescription_id UUID NOT NULL REFERENCES prescriptions(id),
    result VARCHAR(20) NOT NULL,
    fail_reason TEXT,
    reviewed_at TIMESTAMP DEFAULT now(),
    created_at TIMESTAMP DEFAULT now()
);

-- 索引
CREATE INDEX idx_prescriptions_no ON prescriptions(prescription_no);
CREATE INDEX idx_prescriptions_date ON prescriptions(prescribe_date);
CREATE INDEX idx_prescriptions_dept ON prescriptions(department);
CREATE INDEX idx_items_prescription ON prescription_items(prescription_id);
CREATE INDEX idx_review_records_session ON review_records(session_id);
CREATE INDEX idx_review_records_prescription ON review_records(prescription_id);
CREATE INDEX idx_review_sessions_status ON review_sessions(status);

-- RLS 策略
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescription_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read prescriptions" ON prescriptions FOR SELECT USING (true);
CREATE POLICY "Allow read prescription_items" ON prescription_items FOR SELECT USING (true);
CREATE POLICY "Allow all on review_sessions" ON review_sessions FOR ALL USING (true);
CREATE POLICY "Allow all on review_records" ON review_records FOR ALL USING (true);
