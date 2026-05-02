"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const hybridMatchingService_1 = require("../services/hybridMatchingService");
(async () => {
    try {
        const taskId = '9a4ede4a-8560-4dcc-b3ca-25eaaebfdbf2';
        console.log('Generating task embedding...');
        await hybridMatchingService_1.hybridMatchingService.generateTaskEmbedding(taskId);
        console.log('Matching students for task...');
        const matches = await hybridMatchingService_1.hybridMatchingService.matchStudentsForTask(taskId, 10);
        console.log(`\n✅ Found ${matches.length} matched students:`);
        console.log(JSON.stringify(matches, null, 2));
        process.exit(0);
    }
    catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
})();
//# sourceMappingURL=testMatching.js.map