-- E-18: 交付物档案管理
-- 企业可以查看、管理、下载所有历史交付物，支持分类、搜索、评价

-- 交付物档案表
CREATE TABLE deliverable_archives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id),
  company_id UUID NOT NULL REFERENCES users(id),
  student_id UUID NOT NULL REFERENCES users(id),

  -- 交付物信息
  title VARCHAR(200) NOT NULL,
  description TEXT,
  category VARCHAR(50),  -- 'design', 'code', 'document', 'video', 'other'

  -- 文件信息
  files JSONB NOT NULL DEFAULT '[]',
  -- [
  --   {filename: 'design.psd', url: 'https://...', size: 1024000, type: 'image/psd'},
  --   {filename: 'code.zip', url: 'https://...', size: 2048000, type: 'application/zip'}
  -- ]

  total_file_size BIGINT DEFAULT 0,  -- 总文件大小（字节）
  file_count INTEGER DEFAULT 0,

  -- 任务关联信息
  task_title VARCHAR(200),
  task_budget DECIMAL(10,2),
  task_category VARCHAR(50),
  completed_at TIMESTAMPTZ,

  -- 质量评估
  quality_score DECIMAL(3,2),  -- 企业评分
  ai_quality_score DECIMAL(3,2),  -- AI评分
  quality_notes TEXT,

  -- 标签和分类
  tags TEXT[] DEFAULT '{}',
  custom_category VARCHAR(100),  -- 企业自定义分类

  -- 使用情况
  download_count INTEGER DEFAULT 0,
  last_downloaded_at TIMESTAMPTZ,
  view_count INTEGER DEFAULT 0,
  last_viewed_at TIMESTAMPTZ,

  -- 备注
  company_notes TEXT,  -- 企业备注
  is_archived BOOLEAN DEFAULT false,  -- 是否归档
  is_favorite BOOLEAN DEFAULT false,  -- 是否收藏

  -- 元数据
  archived_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 交付物下载记录
CREATE TABLE deliverable_downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deliverable_id UUID NOT NULL REFERENCES deliverable_archives(id),
  downloaded_by UUID NOT NULL REFERENCES users(id),
  downloaded_files TEXT[],  -- 下载了哪些文件
  download_method VARCHAR(50),  -- 'single', 'batch', 'all'
  downloaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- 交付物版本历史
CREATE TABLE deliverable_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deliverable_id UUID NOT NULL REFERENCES deliverable_archives(id),
  version_number INTEGER NOT NULL,
  files JSONB NOT NULL,
  change_notes TEXT,
  uploaded_by UUID REFERENCES users(id),
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- 交付物分类（企业自定义）
CREATE TABLE deliverable_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES users(id),
  category_name VARCHAR(100) NOT NULL,
  description TEXT,
  color VARCHAR(20),
  icon VARCHAR(50),
  deliverable_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(company_id, category_name)
);

-- 交付物分享链接
CREATE TABLE deliverable_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deliverable_id UUID NOT NULL REFERENCES deliverable_archives(id),
  company_id UUID NOT NULL REFERENCES users(id),

  share_code VARCHAR(50) UNIQUE NOT NULL,
  share_password VARCHAR(100),  -- 可选密码保护

  expires_at TIMESTAMPTZ,
  max_downloads INTEGER,  -- 最大下载次数
  current_downloads INTEGER DEFAULT 0,

  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_archives_company ON deliverable_archives(company_id, archived_at DESC);
CREATE INDEX idx_archives_student ON deliverable_archives(student_id, archived_at DESC);
CREATE INDEX idx_archives_task ON deliverable_archives(task_id);
CREATE INDEX idx_archives_category ON deliverable_archives(category, company_id);
CREATE INDEX idx_archives_tags ON deliverable_archives USING GIN(tags);
CREATE INDEX idx_archives_favorite ON deliverable_archives(company_id, is_favorite) WHERE is_favorite = true;
CREATE INDEX idx_downloads_deliverable ON deliverable_downloads(deliverable_id, downloaded_at DESC);
CREATE INDEX idx_versions_deliverable ON deliverable_versions(deliverable_id, version_number DESC);
CREATE INDEX idx_categories_company ON deliverable_categories(company_id);
CREATE INDEX idx_shares_code ON deliverable_shares(share_code) WHERE is_active = true;

-- 任务完成时自动归档交付物
CREATE OR REPLACE FUNCTION auto_archive_deliverable()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' AND NEW.deliverable_url IS NOT NULL THEN
    INSERT INTO deliverable_archives (
      id,
      task_id,
      company_id,
      student_id,
      title,
      description,
      category,
      files,
      task_title,
      task_budget,
      task_category,
      completed_at,
      quality_score
    ) VALUES (
      gen_random_uuid(),
      NEW.id,
      NEW.company_id,
      NEW.student_id,
      NEW.title,
      NEW.description,
      NEW.category,
      jsonb_build_array(
        jsonb_build_object(
          'filename', 'deliverable',
          'url', NEW.deliverable_url,
          'type', 'unknown'
        )
      ),
      NEW.title,
      NEW.budget,
      NEW.category,
      NEW.completed_at,
      NEW.client_rating
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_archive_deliverable
AFTER UPDATE ON tasks
FOR EACH ROW
WHEN (NEW.status = 'completed')
EXECUTE FUNCTION auto_archive_deliverable();

-- 更新下载次数的触发器
CREATE OR REPLACE FUNCTION update_deliverable_download_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE deliverable_archives
  SET download_count = download_count + 1,
      last_downloaded_at = NEW.downloaded_at
  WHERE id = NEW.deliverable_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_deliverable_download_count
AFTER INSERT ON deliverable_downloads
FOR EACH ROW
EXECUTE FUNCTION update_deliverable_download_count();

-- 更新分类中的交付物数量
CREATE OR REPLACE FUNCTION update_category_deliverable_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.custom_category IS NOT NULL THEN
    UPDATE deliverable_categories
    SET deliverable_count = deliverable_count + 1
    WHERE company_id = NEW.company_id AND category_name = NEW.custom_category;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.custom_category IS DISTINCT FROM NEW.custom_category THEN
      -- 从旧分类减少
      IF OLD.custom_category IS NOT NULL THEN
        UPDATE deliverable_categories
        SET deliverable_count = deliverable_count - 1
        WHERE company_id = OLD.company_id AND category_name = OLD.custom_category;
      END IF;
      -- 向新分类增加
      IF NEW.custom_category IS NOT NULL THEN
        UPDATE deliverable_categories
        SET deliverable_count = deliverable_count + 1
        WHERE company_id = NEW.company_id AND category_name = NEW.custom_category;
      END IF;
    END IF;
  ELSIF TG_OP = 'DELETE' AND OLD.custom_category IS NOT NULL THEN
    UPDATE deliverable_categories
    SET deliverable_count = deliverable_count - 1
    WHERE company_id = OLD.company_id AND category_name = OLD.custom_category;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_category_deliverable_count
AFTER INSERT OR UPDATE OR DELETE ON deliverable_archives
FOR EACH ROW
EXECUTE FUNCTION update_category_deliverable_count();

-- 扩展用户表，添加档案统计
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_deliverables INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_archive_size BIGINT DEFAULT 0;

-- 更新企业档案统计的触发器
CREATE OR REPLACE FUNCTION update_company_archive_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE users
    SET total_deliverables = total_deliverables + 1,
        total_archive_size = total_archive_size + NEW.total_file_size
    WHERE id = NEW.company_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE users
    SET total_deliverables = total_deliverables - 1,
        total_archive_size = total_archive_size - OLD.total_file_size
    WHERE id = OLD.company_id;
  ELSIF TG_OP = 'UPDATE' AND OLD.total_file_size != NEW.total_file_size THEN
    UPDATE users
    SET total_archive_size = total_archive_size - OLD.total_file_size + NEW.total_file_size
    WHERE id = NEW.company_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_company_archive_stats
AFTER INSERT OR UPDATE OR DELETE ON deliverable_archives
FOR EACH ROW
EXECUTE FUNCTION update_company_archive_stats();

COMMENT ON TABLE deliverable_archives IS 'E-18: 交付物档案，企业的历史交付物库';
COMMENT ON TABLE deliverable_downloads IS '交付物下载记录';
COMMENT ON TABLE deliverable_versions IS '交付物版本历史';
COMMENT ON TABLE deliverable_categories IS '企业自定义交付物分类';
COMMENT ON TABLE deliverable_shares IS '交付物分享链接';
