declare class SkillTagService {
    /**
     * 获取用户的技能标签（用于招募帖预填）
     */
    getUserSkills(userId: string): Promise<string[]>;
    /**
     * 构建用户技能画像
     */
    private buildUserSkillProfile;
    /**
     * 获取技能标签库（按赛道分类）
     */
    getSkillLibrary(track?: 'content' | 'dev'): Promise<{
        content: string[];
        dev: string[];
        common: string[];
    }>;
    /**
     * 智能推荐需求技能（基于项目描述）
     */
    recommendRequiredSkills(projectDescription: string, track: 'content' | 'dev'): Promise<Array<{
        skillName: string;
        requiredLevel: 'must' | 'plus';
    }>>;
    /**
     * 验证技能标签是否有效
     */
    validateSkillTags(skills: string[]): Promise<{
        valid: boolean;
        invalidSkills: string[];
    }>;
}
declare const _default: SkillTagService;
export default _default;
//# sourceMappingURL=skillTagService.d.ts.map