"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const contentController_1 = require("./contentController");
const router = (0, express_1.Router)();
// OPC故事墙
router.get('/stories', contentController_1.getOPCStories);
router.post('/stories/:id/review', contentController_1.reviewOPCStory);
router.delete('/stories/:id', contentController_1.deleteOPCStory);
// 公告管理
router.get('/announcements', contentController_1.getAnnouncements);
router.post('/announcements', contentController_1.createAnnouncement);
router.put('/announcements/:id', contentController_1.updateAnnouncement);
router.post('/announcements/:id/publish', contentController_1.publishAnnouncement);
router.delete('/announcements/:id', contentController_1.deleteAnnouncement);
// 轮播图管理
router.get('/banners', contentController_1.getBanners);
router.post('/banners', contentController_1.createBanner);
router.put('/banners/:id', contentController_1.updateBanner);
router.delete('/banners/:id', contentController_1.deleteBanner);
exports.default = router;
//# sourceMappingURL=contentRoutes.js.map