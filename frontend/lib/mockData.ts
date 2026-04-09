// 模拟数据库 - 三端共享数据
export interface Task {
  id: number;
  title: string;
  category: string;
  budget: number;
  duration: number;
  description: string;
  requirements: string;
  skills: string[];
  companyName: string;
  status: "匹配中" | "等待学生确认" | "等待企业选择" | "进行中" | "已完成";
  progress: number;
  matchedStudents?: MatchedStudent[]; // AI匹配的5个学生
  acceptedStudents?: AcceptedStudent[]; // 接受任务的学生
  assignedStudent?: string; // 企业最终选择的学生
  createdAt: string;
  submissions?: Submission[];
}

export interface MatchedStudent {
  studentName: string;
  matchScore: number; // 匹配度 0-100
  matchReason: string; // AI分析的匹配原因
  status: "待确认" | "已接受" | "已拒绝";
  responseTime?: string;
}

export interface AcceptedStudent {
  studentName: string;
  acceptReason: string; // 学生接单理由
  acceptedAt: string;
  studentLevel: string;
  studentScore: number;
  studentTags: string[];
}

export interface Submission {
  id: number;
  taskId: number;
  studentName: string;
  content: string;
  files: string[];
  submittedAt: string;
  status: "待审核" | "已通过" | "需修改";
}

export interface Student {
  id: number;
  name: string;
  level: string;
  tasks: number;
  score: number;
  tags: string[];
  interests: string[]; // 兴趣领域
  skills: string[]; // 擅长技能
}

export interface Company {
  id: number;
  name: string;
  tasksPosted: number;
  tasksCompleted: number;
}

// 模拟数据存储
class DataStore {
  private tasks: Task[] = [
    {
      id: 1,
      title: "开发企业官网",
      category: "开发",
      budget: 5000,
      duration: 30,
      description: "需要开发一个现代化的企业官网，包含首页、产品展示、关于我们等页面",
      requirements: "熟悉React/Vue框架，有响应式设计经验",
      skills: ["编程", "UI设计"],
      companyName: "科技公司A",
      status: "等待企业选择",
      progress: 0,
      createdAt: "2024-06-15",
      matchedStudents: [
        { studentName: "张三", matchScore: 95, matchReason: "精通React开发，有3个企业官网项目经验，设计能力强", status: "已接受", responseTime: "2024-06-15 10:30" },
        { studentName: "王五", matchScore: 92, matchReason: "全栈开发能力突出，有大型项目管理经验", status: "已接受", responseTime: "2024-06-15 11:20" },
        { studentName: "钱七", matchScore: 88, matchReason: "前端技术扎实，擅长响应式设计和用户体验优化", status: "已拒绝", responseTime: "2024-06-15 09:45" },
        { studentName: "李四", matchScore: 85, matchReason: "有Vue框架经验，文案能力强，适合内容型网站", status: "待确认" },
        { studentName: "赵六", matchScore: 82, matchReason: "设计功底好，有UI/UX经验，适合视觉要求高的项目", status: "待确认" },
      ],
      acceptedStudents: [
        {
          studentName: "张三",
          acceptReason: "我有3年React开发经验，完成过5个企业官网项目，擅长现代化设计和性能优化。我对贵公司的业务很感兴趣，相信能做出符合预期的高质量网站。",
          acceptedAt: "2024-06-15 10:30",
          studentLevel: "J5",
          studentScore: 85,
          studentTags: ["编程", "设计", "沟通"]
        },
        {
          studentName: "王五",
          acceptReason: "我是全栈工程师，不仅能完成前端开发，还能协助后端接口设计。我有大型项目管理经验，能确保项目按时高质量交付。",
          acceptedAt: "2024-06-15 11:20",
          studentLevel: "J7",
          studentScore: 92,
          studentTags: ["编程", "项目管理", "领导力"]
        }
      ]
    },
    {
      id: 2,
      title: "设计Logo和VI",
      category: "设计",
      budget: 3000,
      duration: 15,
      description: "为新品牌设计Logo和完整的视觉识别系统",
      requirements: "有品牌设计经验，熟练使用AI/PS",
      skills: ["UI设计", "创意"],
      companyName: "创业公司B",
      status: "进行中",
      progress: 65,
      createdAt: "2024-06-10",
      assignedStudent: "李四",
      matchedStudents: [
        { studentName: "李四", matchScore: 96, matchReason: "专业设计背景，有多个品牌VI设计案例", status: "已接受" },
        { studentName: "赵六", matchScore: 90, matchReason: "创意能力强，擅长现代简约风格", status: "已接受" },
        { studentName: "张三", matchScore: 75, matchReason: "有设计基础，但主要专长是开发", status: "已拒绝" },
      ]
    },
    {
      id: 3,
      title: "编写产品文案",
      category: "文案",
      budget: 2000,
      duration: 10,
      description: "为电商平台编写产品详情页文案",
      requirements: "有电商文案经验，文笔流畅",
      skills: ["文案写作"],
      companyName: "电商平台C",
      status: "等待学生确认",
      progress: 0,
      createdAt: "2024-06-18",
      matchedStudents: [
        { studentName: "李四", matchScore: 93, matchReason: "文案功底扎实，有电商行业经验", status: "待确认" },
        { studentName: "张三", matchScore: 70, matchReason: "有一定文案能力，但主要专长是技术", status: "待确认" },
      ]
    },
  ];

  private students: Student[] = [
    {
      id: 1,
      name: "张三",
      level: "J5",
      tasks: 12,
      score: 85,
      tags: ["编程", "设计", "沟通"],
      interests: ["Web开发", "UI设计", "用户体验"],
      skills: ["React", "Vue", "响应式设计", "前端优化"]
    },
    {
      id: 2,
      name: "李四",
      level: "J3",
      tasks: 8,
      score: 72,
      tags: ["文案", "营销"],
      interests: ["内容创作", "品牌设计", "电商运营"],
      skills: ["文案写作", "品牌策划", "视觉设计"]
    },
    {
      id: 3,
      name: "王五",
      level: "J7",
      tasks: 25,
      score: 92,
      tags: ["编程", "项目管理", "领导力"],
      interests: ["全栈开发", "架构设计", "团队协作"],
      skills: ["Node.js", "React", "项目管理", "技术选型"]
    },
    {
      id: 4,
      name: "赵六",
      level: "J2",
      tasks: 5,
      score: 68,
      tags: ["设计", "创意"],
      interests: ["平面设计", "插画", "品牌视觉"],
      skills: ["Photoshop", "Illustrator", "创意设计"]
    },
    {
      id: 5,
      name: "钱七",
      level: "J6",
      tasks: 18,
      score: 88,
      tags: ["数据分析", "编程", "沟通"],
      interests: ["前端开发", "数据可视化", "性能优化"],
      skills: ["JavaScript", "数据分析", "响应式设计", "性能优化"]
    },
  ];

  private companies: Company[] = [
    { id: 1, name: "科技公司A", tasksPosted: 15, tasksCompleted: 12 },
    { id: 2, name: "创业公司B", tasksPosted: 8, tasksCompleted: 6 },
    { id: 3, name: "电商平台C", tasksPosted: 20, tasksCompleted: 18 },
    { id: 4, name: "教育机构D", tasksPosted: 10, tasksCompleted: 8 },
  ];

  // AI匹配算法（模拟）
  private matchStudents(task: Task): MatchedStudent[] {
    // 这里应该是真实的AI算法，现在用简单规则模拟
    const matched: MatchedStudent[] = [];

    this.students.forEach(student => {
      let score = 0;
      let reasons: string[] = [];

      // 技能匹配
      const skillMatch = task.skills.filter(s => student.skills.some(ss => ss.includes(s) || s.includes(ss)));
      if (skillMatch.length > 0) {
        score += skillMatch.length * 20;
        reasons.push(`擅长${skillMatch.join("、")}`);
      }

      // 兴趣匹配
      const interestMatch = student.interests.some(i =>
        task.description.includes(i) || task.category.includes(i)
      );
      if (interestMatch) {
        score += 15;
        reasons.push("兴趣方向匹配");
      }

      // 经验匹配
      if (student.tasks > 10) {
        score += 10;
        reasons.push(`完成过${student.tasks}个任务`);
      }

      // 评分匹配
      score += student.score / 10;

      if (score > 60 && matched.length < 5) {
        matched.push({
          studentName: student.name,
          matchScore: Math.min(Math.round(score), 100),
          matchReason: reasons.join("，"),
          status: "待确认"
        });
      }
    });

    return matched.sort((a, b) => b.matchScore - a.matchScore).slice(0, 5);
  }

  // 获取所有任务
  getTasks() {
    return [...this.tasks];
  }

  // 获取单个任务
  getTask(id: number) {
    return this.tasks.find(t => t.id === id);
  }

  // 添加任务（企业发布后自动AI匹配）
  addTask(task: Omit<Task, "id" | "createdAt" | "status" | "progress" | "matchedStudents">) {
    const newTask: Task = {
      ...task,
      id: this.tasks.length + 1,
      status: "匹配中",
      progress: 0,
      createdAt: new Date().toISOString().split('T')[0]
    };

    // AI匹配学生
    newTask.matchedStudents = this.matchStudents(newTask);
    newTask.status = "等待学生确认";

    this.tasks.push(newTask);
    return newTask;
  }

  // 学生响应任务邀请
  respondToTask(taskId: number, studentName: string, accept: boolean, reason?: string) {
    const task = this.getTask(taskId);
    if (!task || !task.matchedStudents) return false;

    const matched = task.matchedStudents.find(m => m.studentName === studentName);
    if (!matched) return false;

    matched.status = accept ? "已接受" : "已拒绝";
    matched.responseTime = new Date().toLocaleString("zh-CN");

    if (accept && reason) {
      const student = this.students.find(s => s.name === studentName);
      if (student) {
        if (!task.acceptedStudents) task.acceptedStudents = [];
        task.acceptedStudents.push({
          studentName,
          acceptReason: reason,
          acceptedAt: matched.responseTime,
          studentLevel: student.level,
          studentScore: student.score,
          studentTags: student.tags
        });
      }
    }

    // 检查是否所有学生都已响应
    const allResponded = task.matchedStudents.every(m => m.status !== "待确认");
    if (allResponded && task.acceptedStudents && task.acceptedStudents.length > 0) {
      task.status = "等待企业选择";
    }

    return true;
  }

  // 企业选择学生
  selectStudent(taskId: number, studentName: string) {
    const task = this.getTask(taskId);
    if (!task) return false;

    task.assignedStudent = studentName;
    task.status = "进行中";
    return true;
  }

  // 更新任务
  updateTask(id: number, updates: Partial<Task>) {
    const index = this.tasks.findIndex(t => t.id === id);
    if (index !== -1) {
      this.tasks[index] = { ...this.tasks[index], ...updates };
      return this.tasks[index];
    }
    return null;
  }

  // 提交作品
  submitWork(submission: Omit<Submission, "id" | "submittedAt" | "status">) {
    const task = this.getTask(submission.taskId);
    if (task) {
      const newSubmission: Submission = {
        ...submission,
        id: (task.submissions?.length || 0) + 1,
        submittedAt: new Date().toLocaleString("zh-CN"),
        status: "待审核"
      };
      if (!task.submissions) {
        task.submissions = [];
      }
      task.submissions.push(newSubmission);
      task.progress = Math.min(task.progress + 20, 100);
      return newSubmission;
    }
    return null;
  }

  // 审核作品
  reviewSubmission(taskId: number, submissionId: number, status: "已通过" | "需修改") {
    const task = this.getTask(taskId);
    if (task && task.submissions) {
      const submission = task.submissions.find(s => s.id === submissionId);
      if (submission) {
        submission.status = status;
        if (status === "已通过" && task.progress >= 100) {
          task.status = "已完成";
        }
        return true;
      }
    }
    return false;
  }

  // 获取学生列表
  getStudents() {
    return [...this.students];
  }

  // 获取学生的任务邀请
  getStudentInvitations(studentName: string) {
    return this.tasks.filter(t =>
      t.matchedStudents?.some(m => m.studentName === studentName)
    );
  }

  // 获取企业列表
  getCompanies() {
    return [...this.companies];
  }

  // 获取统计数据
  getStats() {
    return {
      totalTasks: this.tasks.length,
      activeTasks: this.tasks.filter(t => t.status === "进行中").length,
      completedTasks: this.tasks.filter(t => t.status === "已完成").length,
      totalStudents: this.students.length,
      totalCompanies: this.companies.length,
      totalRevenue: this.tasks.reduce((sum, t) => sum + t.budget, 0)
    };
  }
}

// 创建全局单例
const dataStore = new DataStore();

// 导出访问函数
export const getTasks = () => dataStore.getTasks();
export const getTask = (id: number) => dataStore.getTask(id);
export const addTask = (task: Omit<Task, "id" | "createdAt" | "status" | "progress" | "matchedStudents">) => dataStore.addTask(task);
export const updateTask = (id: number, updates: Partial<Task>) => dataStore.updateTask(id, updates);
export const respondToTask = (taskId: number, studentName: string, accept: boolean, reason?: string) => dataStore.respondToTask(taskId, studentName, accept, reason);
export const selectStudent = (taskId: number, studentName: string) => dataStore.selectStudent(taskId, studentName);
export const submitWork = (submission: Omit<Submission, "id" | "submittedAt" | "status">) => dataStore.submitWork(submission);
export const reviewSubmission = (taskId: number, submissionId: number, status: "已通过" | "需修改") => dataStore.reviewSubmission(taskId, submissionId, status);
export const getStudents = () => dataStore.getStudents();
export const getStudentInvitations = (studentName: string) => dataStore.getStudentInvitations(studentName);
export const getCompanies = () => dataStore.getCompanies();
export const getStats = () => dataStore.getStats();

