"use strict";
(wx["webpackJsonp"] = wx["webpackJsonp"] || []).push([["pages/select-students/index"],{

/***/ "./node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=pages/select-students/index!./src/pages/select-students/index.tsx":
/*!************************************************************************************************************************************!*\
  !*** ./node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=pages/select-students/index!./src/pages/select-students/index.tsx ***!
  \************************************************************************************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": function() { return /* binding */ SelectStudents; }
/* harmony export */ });
/* harmony import */ var _Users_alwan_code_qicheng_company_miniapp_node_modules_babel_runtime_helpers_esm_toConsumableArray_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/toConsumableArray.js */ "./node_modules/@babel/runtime/helpers/esm/toConsumableArray.js");
/* harmony import */ var _Users_alwan_code_qicheng_company_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/regenerator.js */ "./node_modules/@babel/runtime/helpers/esm/regenerator.js");
/* harmony import */ var _Users_alwan_code_qicheng_company_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/asyncToGenerator.js */ "./node_modules/@babel/runtime/helpers/esm/asyncToGenerator.js");
/* harmony import */ var _Users_alwan_code_qicheng_company_miniapp_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/slicedToArray.js */ "./node_modules/@babel/runtime/helpers/esm/slicedToArray.js");
/* harmony import */ var _tarojs_components__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @tarojs/components */ "./node_modules/@tarojs/plugin-platform-weapp/dist/components-react.js");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! react */ "webpack/container/remote/react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_5___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_5__);
/* harmony import */ var _tarojs_taro__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! @tarojs/taro */ "webpack/container/remote/@tarojs/taro");
/* harmony import */ var _tarojs_taro__WEBPACK_IMPORTED_MODULE_6___default = /*#__PURE__*/__webpack_require__.n(_tarojs_taro__WEBPACK_IMPORTED_MODULE_6__);
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! react/jsx-runtime */ "webpack/container/remote/react/jsx-runtime");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__);









function SelectStudents() {
  var router = (0,_tarojs_taro__WEBPACK_IMPORTED_MODULE_6__.useRouter)();
  var taskId = router.params.taskId;
  var _useState = (0,react__WEBPACK_IMPORTED_MODULE_5__.useState)([]),
    _useState2 = (0,_Users_alwan_code_qicheng_company_miniapp_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_3__["default"])(_useState, 2),
    students = _useState2[0],
    setStudents = _useState2[1];
  var _useState3 = (0,react__WEBPACK_IMPORTED_MODULE_5__.useState)([]),
    _useState4 = (0,_Users_alwan_code_qicheng_company_miniapp_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_3__["default"])(_useState3, 2),
    selectedIds = _useState4[0],
    setSelectedIds = _useState4[1];
  var _useState5 = (0,react__WEBPACK_IMPORTED_MODULE_5__.useState)(true),
    _useState6 = (0,_Users_alwan_code_qicheng_company_miniapp_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_3__["default"])(_useState5, 2),
    loading = _useState6[0],
    setLoading = _useState6[1];
  var _useState7 = (0,react__WEBPACK_IMPORTED_MODULE_5__.useState)(false),
    _useState8 = (0,_Users_alwan_code_qicheng_company_miniapp_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_3__["default"])(_useState7, 2),
    submitting = _useState8[0],
    setSubmitting = _useState8[1];
  (0,react__WEBPACK_IMPORTED_MODULE_5__.useEffect)(function () {
    loadMatchedStudents();
  }, [taskId]);
  var loadMatchedStudents = /*#__PURE__*/function () {
    var _ref = (0,_Users_alwan_code_qicheng_company_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_2__["default"])(/*#__PURE__*/(0,_Users_alwan_code_qicheng_company_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_1__["default"])().m(function _callee() {
      var res, _t;
      return (0,_Users_alwan_code_qicheng_company_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_1__["default"])().w(function (_context) {
        while (1) switch (_context.p = _context.n) {
          case 0:
            setLoading(true);
            _context.p = 1;
            _context.n = 2;
            return _tarojs_taro__WEBPACK_IMPORTED_MODULE_6___default().request({
              url: "http://localhost:3000/api/v1/tasks/flow/".concat(taskId, "/matched-students"),
              method: 'GET',
              header: {
                'Authorization': "Bearer ".concat(_tarojs_taro__WEBPACK_IMPORTED_MODULE_6___default().getStorageSync('token'))
              }
            });
          case 2:
            res = _context.v;
            if (res.data.success) {
              setStudents(res.data.data.students || []);
            } else {
              _tarojs_taro__WEBPACK_IMPORTED_MODULE_6___default().showToast({
                title: res.data.message || '加载失败',
                icon: 'none'
              });
            }
            _context.n = 4;
            break;
          case 3:
            _context.p = 3;
            _t = _context.v;
            console.error('加载匹配学生失败:', _t);
            _tarojs_taro__WEBPACK_IMPORTED_MODULE_6___default().showToast({
              title: '网络错误',
              icon: 'none'
            });
          case 4:
            _context.p = 4;
            setLoading(false);
            return _context.f(4);
          case 5:
            return _context.a(2);
        }
      }, _callee, null, [[1, 3, 4, 5]]);
    }));
    return function loadMatchedStudents() {
      return _ref.apply(this, arguments);
    };
  }();
  var handleToggleSelect = function handleToggleSelect(studentId) {
    if (selectedIds.includes(studentId)) {
      setSelectedIds(selectedIds.filter(function (id) {
        return id !== studentId;
      }));
    } else {
      if (selectedIds.length >= 5) {
        _tarojs_taro__WEBPACK_IMPORTED_MODULE_6___default().showToast({
          title: '最多选择5名学生',
          icon: 'none'
        });
        return;
      }
      setSelectedIds([].concat((0,_Users_alwan_code_qicheng_company_miniapp_node_modules_babel_runtime_helpers_esm_toConsumableArray_js__WEBPACK_IMPORTED_MODULE_0__["default"])(selectedIds), [studentId]));
    }
  };
  var handleSubmit = /*#__PURE__*/function () {
    var _ref2 = (0,_Users_alwan_code_qicheng_company_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_2__["default"])(/*#__PURE__*/(0,_Users_alwan_code_qicheng_company_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_1__["default"])().m(function _callee3() {
      return (0,_Users_alwan_code_qicheng_company_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_1__["default"])().w(function (_context3) {
        while (1) switch (_context3.n) {
          case 0:
            if (!(selectedIds.length === 0)) {
              _context3.n = 1;
              break;
            }
            _tarojs_taro__WEBPACK_IMPORTED_MODULE_6___default().showToast({
              title: '请至少选择1名学生',
              icon: 'none'
            });
            return _context3.a(2);
          case 1:
            _tarojs_taro__WEBPACK_IMPORTED_MODULE_6___default().showModal({
              title: '确认选择',
              content: "\u786E\u8BA4\u9080\u8BF7".concat(selectedIds.length, "\u540D\u5B66\u751F\u63A5\u5355\u5417\uFF1F\u7B2C\u4E00\u4E2A\u63A5\u53D7\u7684\u5B66\u751F\u5C06\u83B7\u5F97\u4EFB\u52A1\u3002"),
              success: function () {
                var _success = (0,_Users_alwan_code_qicheng_company_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_2__["default"])(/*#__PURE__*/(0,_Users_alwan_code_qicheng_company_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_1__["default"])().m(function _callee2(modalRes) {
                  return (0,_Users_alwan_code_qicheng_company_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_1__["default"])().w(function (_context2) {
                    while (1) switch (_context2.n) {
                      case 0:
                        if (!modalRes.confirm) {
                          _context2.n = 1;
                          break;
                        }
                        _context2.n = 1;
                        return submitSelection();
                      case 1:
                        return _context2.a(2);
                    }
                  }, _callee2);
                }));
                function success(_x) {
                  return _success.apply(this, arguments);
                }
                return success;
              }()
            });
          case 2:
            return _context3.a(2);
        }
      }, _callee3);
    }));
    return function handleSubmit() {
      return _ref2.apply(this, arguments);
    };
  }();
  var submitSelection = /*#__PURE__*/function () {
    var _ref3 = (0,_Users_alwan_code_qicheng_company_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_2__["default"])(/*#__PURE__*/(0,_Users_alwan_code_qicheng_company_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_1__["default"])().m(function _callee4() {
      var res, _t2;
      return (0,_Users_alwan_code_qicheng_company_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_1__["default"])().w(function (_context4) {
        while (1) switch (_context4.p = _context4.n) {
          case 0:
            setSubmitting(true);
            _context4.p = 1;
            _tarojs_taro__WEBPACK_IMPORTED_MODULE_6___default().showLoading({
              title: '发送邀请中...'
            });
            _context4.n = 2;
            return _tarojs_taro__WEBPACK_IMPORTED_MODULE_6___default().request({
              url: "http://localhost:3000/api/v1/tasks/flow/".concat(taskId, "/select-students"),
              method: 'POST',
              header: {
                'Authorization': "Bearer ".concat(_tarojs_taro__WEBPACK_IMPORTED_MODULE_6___default().getStorageSync('token'))
              },
              data: {
                studentIds: selectedIds
              }
            });
          case 2:
            res = _context4.v;
            _tarojs_taro__WEBPACK_IMPORTED_MODULE_6___default().hideLoading();
            if (!res.data.success) {
              _context4.n = 3;
              break;
            }
            _tarojs_taro__WEBPACK_IMPORTED_MODULE_6___default().showToast({
              title: '邀请已发送',
              icon: 'success'
            });
            setTimeout(function () {
              _tarojs_taro__WEBPACK_IMPORTED_MODULE_6___default().redirectTo({
                url: '/pages/tasks/index'
              });
            }, 1500);
            _context4.n = 4;
            break;
          case 3:
            throw new Error(res.data.message || '发送失败');
          case 4:
            _context4.n = 6;
            break;
          case 5:
            _context4.p = 5;
            _t2 = _context4.v;
            _tarojs_taro__WEBPACK_IMPORTED_MODULE_6___default().hideLoading();
            console.error('发送邀请失败:', _t2);
            _tarojs_taro__WEBPACK_IMPORTED_MODULE_6___default().showToast({
              title: _t2.message || '发送失败',
              icon: 'none'
            });
          case 6:
            _context4.p = 6;
            setSubmitting(false);
            return _context4.f(6);
          case 7:
            return _context4.a(2);
        }
      }, _callee4, null, [[1, 5, 6, 7]]);
    }));
    return function submitSelection() {
      return _ref3.apply(this, arguments);
    };
  }();
  if (loading) {
    return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.View, {
      className: "select-students-page",
      children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.View, {
        className: "loading",
        children: "\u52A0\u8F7D\u4E2D..."
      })
    });
  }
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.View, {
    className: "select-students-page",
    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.View, {
      className: "header",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.Text, {
        className: "title",
        children: "\u9009\u62E9\u5B66\u751F"
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.Text, {
        className: "subtitle",
        children: ["AI\u4E3A\u60A8\u5339\u914D\u4E86", students.length, "\u540D\u5408\u9002\u7684\u5B66\u751F\uFF0C\u8BF7\u9009\u62E95\u540D\u9080\u8BF7\u63A5\u5355"]
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.View, {
        className: "selection-count",
        children: ["\u5DF2\u9009\u62E9 ", /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.Text, {
          className: "count",
          children: selectedIds.length
        }), "/5"]
      })]
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.ScrollView, {
      className: "student-list",
      scrollY: true,
      children: students.map(function (student) {
        return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.View, {
          className: "student-card ".concat(selectedIds.includes(student.studentId) ? 'selected' : ''),
          onClick: function onClick() {
            return handleToggleSelect(student.studentId);
          },
          children: [selectedIds.includes(student.studentId) && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.View, {
            className: "selected-badge",
            children: "\u2713"
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.View, {
            className: "match-badge",
            children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.Text, {
              className: "match-score",
              children: [student.matchScore, "%"]
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.Text, {
              className: "match-text",
              children: "\u5339\u914D"
            })]
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.View, {
            className: "student-info",
            children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.View, {
              className: "student-header",
              children: [student.avatar ? /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.Image, {
                src: student.avatar,
                className: "avatar"
              }) : /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.View, {
                className: "avatar-placeholder",
                children: student.studentName.charAt(0)
              }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.View, {
                className: "student-basic",
                children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.Text, {
                  className: "student-name",
                  children: student.studentName
                }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.Text, {
                  className: "student-level",
                  children: ["Lv.", student.level]
                })]
              })]
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.View, {
              className: "student-stats",
              children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.View, {
                className: "stat-item",
                children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.Text, {
                  className: "stat-value",
                  children: student.completedTasks
                }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.Text, {
                  className: "stat-label",
                  children: "\u5B8C\u6210\u4EFB\u52A1"
                })]
              }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.View, {
                className: "stat-item",
                children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.Text, {
                  className: "stat-value",
                  children: [student.successRate, "%"]
                }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.Text, {
                  className: "stat-label",
                  children: "\u6210\u529F\u7387"
                })]
              }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.View, {
                className: "stat-item",
                children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.Text, {
                  className: "stat-value",
                  children: student.averageRating.toFixed(1)
                }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.Text, {
                  className: "stat-label",
                  children: "\u5E73\u5747\u8BC4\u5206"
                })]
              })]
            }), student.skills && student.skills.length > 0 && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.View, {
              className: "student-skills",
              children: student.skills.map(function (skill, index) {
                return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.View, {
                  className: "skill-tag",
                  children: skill
                }, index);
              })
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.View, {
              className: "match-reason",
              children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.Text, {
                className: "reason-label",
                children: "\u63A8\u8350\u7406\u7531\uFF1A"
              }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.Text, {
                className: "reason-text",
                children: student.matchReason
              })]
            }), student.recentWorks && student.recentWorks.length > 0 && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.View, {
              className: "recent-works",
              children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.Text, {
                className: "works-label",
                children: "\u8FD1\u671F\u4F5C\u54C1"
              }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.View, {
                className: "works-grid",
                children: student.recentWorks.map(function (work, index) {
                  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.Image, {
                    src: work,
                    className: "work-image",
                    mode: "aspectFill"
                  }, index);
                })
              })]
            })]
          })]
        }, student.studentId);
      })
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.View, {
      className: "bottom-actions",
      children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.Button, {
        className: "submit-btn",
        onClick: handleSubmit,
        disabled: submitting || selectedIds.length === 0,
        children: submitting ? '发送中...' : "\u9080\u8BF7".concat(selectedIds.length, "\u540D\u5B66\u751F")
      })
    })]
  });
}

/***/ }),

/***/ "./src/pages/select-students/index.tsx":
/*!*********************************************!*\
  !*** ./src/pages/select-students/index.tsx ***!
  \*********************************************/
/***/ (function(__unused_webpack_module, __unused_webpack___webpack_exports__, __webpack_require__) {

/* harmony import */ var _tarojs_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @tarojs/runtime */ "webpack/container/remote/@tarojs/runtime");
/* harmony import */ var _tarojs_runtime__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_tarojs_runtime__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _node_modules_tarojs_taro_loader_lib_entry_cache_js_name_pages_select_students_index_index_tsx__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! !!../../../node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=pages/select-students/index!./index.tsx */ "./node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=pages/select-students/index!./src/pages/select-students/index.tsx");


var config = {};


var inst = Page((0,_tarojs_runtime__WEBPACK_IMPORTED_MODULE_0__.createPageConfig)(_node_modules_tarojs_taro_loader_lib_entry_cache_js_name_pages_select_students_index_index_tsx__WEBPACK_IMPORTED_MODULE_1__["default"], 'pages/select-students/index', {root:{cn:[]}}, config || {}))


/* unused harmony default export */ var __WEBPACK_DEFAULT_EXPORT__ = (_node_modules_tarojs_taro_loader_lib_entry_cache_js_name_pages_select_students_index_index_tsx__WEBPACK_IMPORTED_MODULE_1__["default"]);


/***/ })

},
/******/ function(__webpack_require__) { // webpackRuntimeModules
/******/ var __webpack_exec__ = function(moduleId) { return __webpack_require__(__webpack_require__.s = moduleId); }
/******/ __webpack_require__.O(0, ["taro","vendors","common"], function() { return __webpack_exec__("./src/pages/select-students/index.tsx"); });
/******/ var __webpack_exports__ = __webpack_require__.O();
/******/ }
]);
//# sourceMappingURL=index.js.map