"use strict";
(wx["webpackJsonp"] = wx["webpackJsonp"] || []).push([["pages/tasks/index"],{

/***/ "./node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=pages/tasks/index!./src/pages/tasks/index.tsx":
/*!****************************************************************************************************************!*\
  !*** ./node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=pages/tasks/index!./src/pages/tasks/index.tsx ***!
  \****************************************************************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": function() { return /* binding */ Tasks; }
/* harmony export */ });
/* harmony import */ var _Users_alwan_code_qicheng_company_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/regenerator.js */ "./node_modules/@babel/runtime/helpers/esm/regenerator.js");
/* harmony import */ var _Users_alwan_code_qicheng_company_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/asyncToGenerator.js */ "./node_modules/@babel/runtime/helpers/esm/asyncToGenerator.js");
/* harmony import */ var _Users_alwan_code_qicheng_company_miniapp_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/slicedToArray.js */ "./node_modules/@babel/runtime/helpers/esm/slicedToArray.js");
/* harmony import */ var _tarojs_components__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @tarojs/components */ "./node_modules/@tarojs/plugin-platform-weapp/dist/components-react.js");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! react */ "webpack/container/remote/react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_4__);
/* harmony import */ var _tarojs_taro__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! @tarojs/taro */ "webpack/container/remote/@tarojs/taro");
/* harmony import */ var _tarojs_taro__WEBPACK_IMPORTED_MODULE_5___default = /*#__PURE__*/__webpack_require__.n(_tarojs_taro__WEBPACK_IMPORTED_MODULE_5__);
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! react/jsx-runtime */ "webpack/container/remote/react/jsx-runtime");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__);








function Tasks() {
  var _useState = (0,react__WEBPACK_IMPORTED_MODULE_4__.useState)('all'),
    _useState2 = (0,_Users_alwan_code_qicheng_company_miniapp_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_2__["default"])(_useState, 2),
    activeTab = _useState2[0],
    setActiveTab = _useState2[1];
  var _useState3 = (0,react__WEBPACK_IMPORTED_MODULE_4__.useState)([]),
    _useState4 = (0,_Users_alwan_code_qicheng_company_miniapp_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_2__["default"])(_useState3, 2),
    tasks = _useState4[0],
    setTasks = _useState4[1];
  (0,react__WEBPACK_IMPORTED_MODULE_4__.useEffect)(function () {
    loadTasks();
  }, [activeTab]);
  var loadTasks = /*#__PURE__*/function () {
    var _ref = (0,_Users_alwan_code_qicheng_company_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_1__["default"])(/*#__PURE__*/(0,_Users_alwan_code_qicheng_company_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_0__["default"])().m(function _callee() {
      var allTasks;
      return (0,_Users_alwan_code_qicheng_company_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_0__["default"])().w(function (_context) {
        while (1) switch (_context.n) {
          case 0:
            // 模拟数据 - 添加 studentId 用于跳转
            allTasks = [{
              id: 1,
              title: '开发微信小程序商城',
              status: 'in-progress',
              statusText: '进行中',
              student: '张同学',
              studentId: 'stu001',
              progress: 60,
              budget: 3000,
              deadline: '2026-04-20'
            }, {
              id: 2,
              title: '设计企业官网UI',
              status: 'pending-confirm',
              statusText: '待确认',
              student: '李同学',
              studentId: 'stu002',
              progress: 100,
              budget: 2000,
              deadline: '2026-04-15'
            }, {
              id: 3,
              title: '编写产品需求文档',
              status: 'in-progress',
              statusText: '进行中',
              student: '王同学',
              studentId: 'stu003',
              progress: 30,
              budget: 1500,
              deadline: '2026-04-18'
            }, {
              id: 4,
              title: 'Python数据分析脚本',
              status: 'completed',
              statusText: '已完成',
              student: '赵同学',
              studentId: 'stu004',
              progress: 100,
              budget: 1000,
              deadline: '2026-04-10'
            }, {
              id: 5,
              title: '品牌Logo设计',
              status: 'pending-accept',
              statusText: '待接单',
              student: '-',
              studentId: null,
              progress: 0,
              budget: 2500,
              deadline: '2026-04-25'
            }];
            if (activeTab === 'all') {
              setTasks(allTasks);
            } else if (activeTab === 'active') {
              setTasks(allTasks.filter(function (t) {
                return t.status === 'in-progress';
              }));
            } else if (activeTab === 'completed') {
              setTasks(allTasks.filter(function (t) {
                return t.status === 'completed';
              }));
            } else if (activeTab === 'pending') {
              setTasks(allTasks.filter(function (t) {
                return t.status === 'pending-accept' || t.status === 'pending-confirm';
              }));
            }
          case 1:
            return _context.a(2);
        }
      }, _callee);
    }));
    return function loadTasks() {
      return _ref.apply(this, arguments);
    };
  }();
  var viewTaskDetail = function viewTaskDetail(taskId) {
    _tarojs_taro__WEBPACK_IMPORTED_MODULE_5___default().navigateTo({
      url: "/pages/task-detail/index?id=".concat(taskId)
    });
  };
  var handleQuickAction = function handleQuickAction(task, action) {
    switch (action) {
      case 'verify':
        // 待确认 -> 跳转到验收页面
        _tarojs_taro__WEBPACK_IMPORTED_MODULE_5___default().navigateTo({
          url: "/pages/task-verification/index?taskId=".concat(task.id)
        });
        break;
      case 'progress':
        // 进行中 -> 查看进度
        _tarojs_taro__WEBPACK_IMPORTED_MODULE_5___default().navigateTo({
          url: "/pages/task-progress/index?taskId=".concat(task.id)
        });
        break;
      case 'students':
        // 待接单 -> 查看匹配的学生列表
        _tarojs_taro__WEBPACK_IMPORTED_MODULE_5___default().navigateTo({
          url: "/pages/select-students/index?taskId=".concat(task.id)
        });
        break;
      case 'chat':
        // 联系学生
        _tarojs_taro__WEBPACK_IMPORTED_MODULE_5___default().navigateTo({
          url: "/pages/chat-detail/index?taskId=".concat(task.id, "&studentId=").concat(task.studentId)
        });
        break;
    }
  };
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
    className: "tasks-page",
    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
      className: "tabs",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
        className: "tab ".concat(activeTab === 'all' ? 'active' : ''),
        onClick: function onClick() {
          return setActiveTab('all');
        },
        children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
          children: "\u5168\u90E8"
        })
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
        className: "tab ".concat(activeTab === 'active' ? 'active' : ''),
        onClick: function onClick() {
          return setActiveTab('active');
        },
        children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
          children: "\u8FDB\u884C\u4E2D"
        })
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
        className: "tab ".concat(activeTab === 'pending' ? 'active' : ''),
        onClick: function onClick() {
          return setActiveTab('pending');
        },
        children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
          children: "\u5F85\u5904\u7406"
        })
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
        className: "tab ".concat(activeTab === 'completed' ? 'active' : ''),
        onClick: function onClick() {
          return setActiveTab('completed');
        },
        children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
          children: "\u5DF2\u5B8C\u6210"
        })
      })]
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.ScrollView, {
      className: "task-list",
      scrollY: true,
      children: [tasks.map(function (task) {
        return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
          className: "task-card",
          onClick: function onClick() {
            return viewTaskDetail(task.id);
          },
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
            className: "task-header",
            children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
              className: "task-title",
              children: task.title
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
              className: "task-status status-".concat(task.status),
              children: task.statusText
            })]
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
            className: "task-meta",
            children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
              className: "meta-item",
              children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
                className: "meta-label",
                children: "\u6267\u884C\u5B66\u751F:"
              }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
                className: "meta-value",
                children: task.student
              })]
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
              className: "meta-item",
              children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
                className: "meta-label",
                children: "\u9884\u7B97:"
              }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
                className: "meta-value",
                children: ["\xA5", task.budget]
              })]
            })]
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
            className: "task-meta",
            children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
              className: "meta-item",
              children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
                className: "meta-label",
                children: "\u622A\u6B62\u65E5\u671F:"
              }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
                className: "meta-value",
                children: task.deadline
              })]
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
              className: "meta-item",
              children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
                className: "meta-label",
                children: "\u8FDB\u5EA6:"
              }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
                className: "meta-value",
                children: [task.progress, "%"]
              })]
            })]
          }), task.progress > 0 && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
            className: "progress-bar",
            children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
              className: "progress-fill",
              style: {
                width: "".concat(task.progress, "%")
              }
            })
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
            className: "task-actions",
            children: [task.status === 'pending-confirm' && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
              className: "action-btn primary",
              onClick: function onClick(e) {
                e.stopPropagation();
                handleQuickAction(task, 'verify');
              },
              children: "\u9A8C\u6536\u4EFB\u52A1"
            }), task.status === 'in-progress' && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsxs)(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.Fragment, {
              children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
                className: "action-btn",
                onClick: function onClick(e) {
                  e.stopPropagation();
                  handleQuickAction(task, 'progress');
                },
                children: "\u67E5\u770B\u8FDB\u5EA6"
              }), task.studentId && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
                className: "action-btn",
                onClick: function onClick(e) {
                  e.stopPropagation();
                  handleQuickAction(task, 'chat');
                },
                children: "\u8054\u7CFB\u5B66\u751F"
              })]
            }), task.status === 'pending-accept' && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
              className: "action-btn",
              onClick: function onClick(e) {
                e.stopPropagation();
                handleQuickAction(task, 'students');
              },
              children: "\u67E5\u770B\u5339\u914D\u5B66\u751F"
            })]
          })]
        }, task.id);
      }), tasks.length === 0 && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
        className: "empty-state",
        children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
          className: "empty-text",
          children: "\u6682\u65E0\u4EFB\u52A1"
        })
      })]
    })]
  });
}

/***/ }),

/***/ "./src/pages/tasks/index.tsx":
/*!***********************************!*\
  !*** ./src/pages/tasks/index.tsx ***!
  \***********************************/
/***/ (function(__unused_webpack_module, __unused_webpack___webpack_exports__, __webpack_require__) {

/* harmony import */ var _tarojs_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @tarojs/runtime */ "webpack/container/remote/@tarojs/runtime");
/* harmony import */ var _tarojs_runtime__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_tarojs_runtime__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _node_modules_tarojs_taro_loader_lib_entry_cache_js_name_pages_tasks_index_index_tsx__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! !!../../../node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=pages/tasks/index!./index.tsx */ "./node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=pages/tasks/index!./src/pages/tasks/index.tsx");


var config = {"navigationBarTitleText":"任务管理"};


var inst = Page((0,_tarojs_runtime__WEBPACK_IMPORTED_MODULE_0__.createPageConfig)(_node_modules_tarojs_taro_loader_lib_entry_cache_js_name_pages_tasks_index_index_tsx__WEBPACK_IMPORTED_MODULE_1__["default"], 'pages/tasks/index', {root:{cn:[]}}, config || {}))


/* unused harmony default export */ var __WEBPACK_DEFAULT_EXPORT__ = (_node_modules_tarojs_taro_loader_lib_entry_cache_js_name_pages_tasks_index_index_tsx__WEBPACK_IMPORTED_MODULE_1__["default"]);


/***/ })

},
/******/ function(__webpack_require__) { // webpackRuntimeModules
/******/ var __webpack_exec__ = function(moduleId) { return __webpack_require__(__webpack_require__.s = moduleId); }
/******/ __webpack_require__.O(0, ["taro","vendors","common"], function() { return __webpack_exec__("./src/pages/tasks/index.tsx"); });
/******/ var __webpack_exports__ = __webpack_require__.O();
/******/ }
]);
//# sourceMappingURL=index.js.map