export declare class PBLAgentService {
    initializeProject(userId: string, initialProblem: string): Promise<{
        project: any;
        opening_questions: string;
    }>;
    private analyzeInitialProblem;
    private generateOpeningQuestions;
    conductSocraticDialogue(projectId: string, userMessage: string, context?: any): Promise<{
        content: string;
        type: string;
        technique: string;
    }>;
    private detectIfStuck;
    private generateSocraticResponse;
    private analyzeResponseType;
    guideTaskDecomposition(projectId: string, taskTitle: string): Promise<{
        task: any;
        guiding_questions: string;
    }>;
    private generateDecompositionQuestions;
    evaluateDecomposition(taskId: string, subtasks: string[]): Promise<any>;
    private analyzeDecompositionQuality;
    suggestMVPSolution(taskId: string, userContext: string): Promise<any>;
    private generateMVPSolution;
    executeCode(projectId: string, language: string, code: string, taskId?: string): Promise<{
        status: string;
        output: string;
        execution_time: number;
    }>;
    guideReflection(projectId: string, reflectionType: string): Promise<string>;
    private generateReflectionQuestions;
    saveReflectionLog(projectId: string, phaseId: string | null, reflection: {
        reflection_type: string;
        what_learned: string;
        what_worked: string;
        what_didnt_work: string;
        what_surprised: string;
        next_steps: string;
        emotional_state: string;
    }): Promise<any>;
    private getAgentMemory;
    private updateAgentMemory;
    private extractMemories;
    private getProject;
    private getDialogueHistory;
}
export declare const pblAgentService: PBLAgentService;
//# sourceMappingURL=pblAgentService.d.ts.map