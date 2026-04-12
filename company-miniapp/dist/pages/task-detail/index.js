"use strict";
(wx["webpackJsonp"] = wx["webpackJsonp"] || []).push([["pages/task-detail/index"],{

/***/ "./node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=pages/task-detail/index!./src/pages/task-detail/index.tsx":
/*!****************************************************************************************************************************!*\
  !*** ./node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=pages/task-detail/index!./src/pages/task-detail/index.tsx ***!
  \****************************************************************************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": function() { return /* binding */ TaskDetail; }
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








function TaskDetail() {
  var router = (0,_tarojs_taro__WEBPACK_IMPORTED_MODULE_5__.useRouter)();
  var id = router.params.id;
  var _useState = (0,react__WEBPACK_IMPORTED_MODULE_4__.useState)(null),
    _useState2 = (0,_Users_alwan_code_qicheng_company_miniapp_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_2__["default"])(_useState, 2),
    task = _useState2[0],
    setTask = _useState2[1];
  var _useState3 = (0,react__WEBPACK_IMPORTED_MODULE_4__.useState)(null),
    _useState4 = (0,_Users_alwan_code_qicheng_company_miniapp_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_2__["default"])(_useState3, 2),
    deliverable = _useState4[0],
    setDeliverable = _useState4[1];
  var _useState5 = (0,react__WEBPACK_IMPORTED_MODULE_4__.useState)(true),
    _useState6 = (0,_Users_alwan_code_qicheng_company_miniapp_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_2__["default"])(_useState5, 2),
    loading = _useState6[0],
    setLoading = _useState6[1];
  var _useState7 = (0,react__WEBPACK_IMPORTED_MODULE_4__.useState)(false),
    _useState8 = (0,_Users_alwan_code_qicheng_company_miniapp_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_2__["default"])(_useState7, 2),
    showReviewModal = _useState8[0],
    setShowReviewModal = _useState8[1];
  var _useState9 = (0,react__WEBPACK_IMPORTED_MODULE_4__.useState)('approve'),
    _useState0 = (0,_Users_alwan_code_qicheng_company_miniapp_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_2__["default"])(_useState9, 2),
    reviewAction = _useState0[0],
    setReviewAction = _useState0[1];
  var _useState1 = (0,react__WEBPACK_IMPORTED_MODULE_4__.useState)(''),
    _useState10 = (0,_Users_alwan_code_qicheng_company_miniapp_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_2__["default"])(_useState1, 2),
    reviewFeedback = _useState10[0],
    setReviewFeedback = _useState10[1];
  (0,react__WEBPACK_IMPORTED_MODULE_4__.useEffect)(function () {
    loadTaskDetail();
  }, [id]);
  var loadTaskDetail = /*#__PURE__*/function () {
    var _ref = (0,_Users_alwan_code_qicheng_company_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_1__["default"])(/*#__PURE__*/(0,_Users_alwan_code_qicheng_company_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_0__["default"])().m(function _callee() {
      var taskRes, deliverableRes, _t;
      return (0,_Users_alwan_code_qicheng_company_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_0__["default"])().w(function (_context) {
        while (1) switch (_context.p = _context.n) {
          case 0:
            setLoading(true);
            _context.p = 1;
            _context.n = 2;
            return _tarojs_taro__WEBPACK_IMPORTED_MODULE_5___default().request({
              url: "http://localhost:3000/api/v1/tasks/".concat(id),
              method: 'GET',
              header: {
                'Authorization': "Bearer ".concat(_tarojs_taro__WEBPACK_IMPORTED_MODULE_5___default().getStorageSync('token'))
              }
            });
          case 2:
            taskRes = _context.v;
            if (taskRes.data.success) {
              setTask(taskRes.data.data);
            }

            // 加载交付物
            _context.n = 3;
            return _tarojs_taro__WEBPACK_IMPORTED_MODULE_5___default().request({
              url: "http://localhost:3000/api/v1/tasks/flow/".concat(id, "/deliverable"),
              method: 'GET',
              header: {
                'Authorization': "Bearer ".concat(_tarojs_taro__WEBPACK_IMPORTED_MODULE_5___default().getStorageSync('token'))
              }
            });
          case 3:
            deliverableRes = _context.v;
            if (deliverableRes.data.success) {
              setDeliverable(deliverableRes.data.data);
            }
            _context.n = 5;
            break;
          case 4:
            _context.p = 4;
            _t = _context.v;
            console.error('加载任务详情失败:', _t);
            _tarojs_taro__WEBPACK_IMPORTED_MODULE_5___default().showToast({
              title: '加载失败',
              icon: 'none'
            });
          case 5:
            _context.p = 5;
            setLoading(false);
            return _context.f(5);
          case 6:
            return _context.a(2);
        }
      }, _callee, null, [[1, 4, 5, 6]]);
    }));
    return function loadTaskDetail() {
      return _ref.apply(this, arguments);
    };
  }();
  var handleReview = function handleReview(action) {
    setReviewAction(action);
    setShowReviewModal(true);
  };
  var handleSubmitReview = /*#__PURE__*/function () {
    var _ref2 = (0,_Users_alwan_code_qicheng_company_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_1__["default"])(/*#__PURE__*/(0,_Users_alwan_code_qicheng_company_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_0__["default"])().m(function _callee2() {
      var res, _t2;
      return (0,_Users_alwan_code_qicheng_company_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_0__["default"])().w(function (_context2) {
        while (1) switch (_context2.p = _context2.n) {
          case 0:
            if (!(reviewAction === 'reject' && !reviewFeedback.trim())) {
              _context2.n = 1;
              break;
            }
            _tarojs_taro__WEBPACK_IMPORTED_MODULE_5___default().showToast({
              title: '请填写拒绝原因',
              icon: 'none'
            });
            return _context2.a(2);
          case 1:
            _context2.p = 1;
            _tarojs_taro__WEBPACK_IMPORTED_MODULE_5___default().showLoading({
              title: '提交中...'
            });
            _context2.n = 2;
            return _tarojs_taro__WEBPACK_IMPORTED_MODULE_5___default().request({
              url: "http://localhost:3000/api/v1/tasks/flow/".concat(id, "/company-review"),
              method: 'POST',
              header: {
                'Authorization': "Bearer ".concat(_tarojs_taro__WEBPACK_IMPORTED_MODULE_5___default().getStorageSync('token'))
              },
              data: {
                approved: reviewAction === 'approve',
                feedback: reviewFeedback
              }
            });
          case 2:
            res = _context2.v;
            _tarojs_taro__WEBPACK_IMPORTED_MODULE_5___default().hideLoading();
            if (res.data.success) {
              _tarojs_taro__WEBPACK_IMPORTED_MODULE_5___default().showToast({
                title: reviewAction === 'approve' ? '验收通过' : '已拒绝',
                icon: 'success'
              });
              setShowReviewModal(false);
              setReviewFeedback('');

              // 如果通过验收，跳转到支付页面
              if (reviewAction === 'approve') {
                setTimeout(function () {
                  _tarojs_taro__WEBPACK_IMPORTED_MODULE_5___default().navigateTo({
                    url: "/pages/payment/index?taskId=".concat(id, "&type=final")
                  });
                }, 1500);
              } else {
                loadTaskDetail();
              }
            } else {
              _tarojs_taro__WEBPACK_IMPORTED_MODULE_5___default().showToast({
                title: res.data.message || '操作失败',
                icon: 'none'
              });
            }
            _context2.n = 4;
            break;
          case 3:
            _context2.p = 3;
            _t2 = _context2.v;
            _tarojs_taro__WEBPACK_IMPORTED_MODULE_5___default().hideLoading();
            console.error('提交验收失败:', _t2);
            _tarojs_taro__WEBPACK_IMPORTED_MODULE_5___default().showToast({
              title: '网络错误',
              icon: 'none'
            });
          case 4:
            return _context2.a(2);
        }
      }, _callee2, null, [[1, 3]]);
    }));
    return function handleSubmitReview() {
      return _ref2.apply(this, arguments);
    };
  }();
  var handlePayFinal = function handlePayFinal() {
    _tarojs_taro__WEBPACK_IMPORTED_MODULE_5___default().navigateTo({
      url: "/pages/payment/index?taskId=".concat(id, "&type=final")
    });
  };
  var handleConfirm = /*#__PURE__*/function () {
    var _ref3 = (0,_Users_alwan_code_qicheng_company_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_1__["default"])(/*#__PURE__*/(0,_Users_alwan_code_qicheng_company_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_0__["default"])().m(function _callee4() {
      return (0,_Users_alwan_code_qicheng_company_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_0__["default"])().w(function (_context4) {
        while (1) switch (_context4.n) {
          case 0:
            _tarojs_taro__WEBPACK_IMPORTED_MODULE_5___default().showModal({
              title: '确认完成',
              content: '确认任务已完成并最终验收通过吗？',
              success: function () {
                var _success = (0,_Users_alwan_code_qicheng_company_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_1__["default"])(/*#__PURE__*/(0,_Users_alwan_code_qicheng_company_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_0__["default"])().m(function _callee3(modalRes) {
                  var res, _t3;
                  return (0,_Users_alwan_code_qicheng_company_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_0__["default"])().w(function (_context3) {
                    while (1) switch (_context3.p = _context3.n) {
                      case 0:
                        if (!modalRes.confirm) {
                          _context3.n = 4;
                          break;
                        }
                        _context3.p = 1;
                        _tarojs_taro__WEBPACK_IMPORTED_MODULE_5___default().showLoading({
                          title: '处理中...'
                        });
                        _context3.n = 2;
                        return _tarojs_taro__WEBPACK_IMPORTED_MODULE_5___default().request({
                          url: "http://localhost:3000/api/v1/tasks/flow/".concat(id, "/final-confirm"),
                          method: 'POST',
                          header: {
                            'Authorization': "Bearer ".concat(_tarojs_taro__WEBPACK_IMPORTED_MODULE_5___default().getStorageSync('token'))
                          }
                        });
                      case 2:
                        res = _context3.v;
                        _tarojs_taro__WEBPACK_IMPORTED_MODULE_5___default().hideLoading();
                        if (res.data.success) {
                          _tarojs_taro__WEBPACK_IMPORTED_MODULE_5___default().showToast({
                            title: '任务已完成',
                            icon: 'success'
                          });
                          setTimeout(function () {
                            _tarojs_taro__WEBPACK_IMPORTED_MODULE_5___default().navigateBack();
                          }, 1500);
                        } else {
                          _tarojs_taro__WEBPACK_IMPORTED_MODULE_5___default().showToast({
                            title: res.data.message || '操作失败',
                            icon: 'none'
                          });
                        }
                        _context3.n = 4;
                        break;
                      case 3:
                        _context3.p = 3;
                        _t3 = _context3.v;
                        _tarojs_taro__WEBPACK_IMPORTED_MODULE_5___default().hideLoading();
                        console.error('确认失败:', _t3);
                        _tarojs_taro__WEBPACK_IMPORTED_MODULE_5___default().showToast({
                          title: '网络错误',
                          icon: 'none'
                        });
                      case 4:
                        return _context3.a(2);
                    }
                  }, _callee3, null, [[1, 3]]);
                }));
                function success(_x) {
                  return _success.apply(this, arguments);
                }
                return success;
              }()
            });
          case 1:
            return _context4.a(2);
        }
      }, _callee4);
    }));
    return function handleConfirm() {
      return _ref3.apply(this, arguments);
    };
  }();
  var handleCancelTask = function handleCancelTask() {
    _tarojs_taro__WEBPACK_IMPORTED_MODULE_5___default().showModal({
      title: '取消任务',
      content: '取消任务后将扣除30%定金作为违约金，确认取消吗？',
      confirmText: '确认取消',
      confirmColor: '#EF4444',
      success: function () {
        var _success2 = (0,_Users_alwan_code_qicheng_company_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_1__["default"])(/*#__PURE__*/(0,_Users_alwan_code_qicheng_company_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_0__["default"])().m(function _callee5(modalRes) {
          var res, _t4;
          return (0,_Users_alwan_code_qicheng_company_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_0__["default"])().w(function (_context5) {
            while (1) switch (_context5.p = _context5.n) {
              case 0:
                if (!modalRes.confirm) {
                  _context5.n = 4;
                  break;
                }
                _context5.p = 1;
                _tarojs_taro__WEBPACK_IMPORTED_MODULE_5___default().showLoading({
                  title: '处理中...'
                });
                _context5.n = 2;
                return _tarojs_taro__WEBPACK_IMPORTED_MODULE_5___default().request({
                  url: "http://localhost:3000/api/v1/tasks/".concat(id, "/cancel"),
                  method: 'POST',
                  header: {
                    'Authorization': "Bearer ".concat(_tarojs_taro__WEBPACK_IMPORTED_MODULE_5___default().getStorageSync('token'))
                  }
                });
              case 2:
                res = _context5.v;
                _tarojs_taro__WEBPACK_IMPORTED_MODULE_5___default().hideLoading();
                if (res.data.success) {
                  _tarojs_taro__WEBPACK_IMPORTED_MODULE_5___default().showToast({
                    title: '任务已取消',
                    icon: 'success'
                  });
                  setTimeout(function () {
                    _tarojs_taro__WEBPACK_IMPORTED_MODULE_5___default().navigateBack();
                  }, 1500);
                } else {
                  _tarojs_taro__WEBPACK_IMPORTED_MODULE_5___default().showToast({
                    title: res.data.message || '操作失败',
                    icon: 'none'
                  });
                }
                _context5.n = 4;
                break;
              case 3:
                _context5.p = 3;
                _t4 = _context5.v;
                _tarojs_taro__WEBPACK_IMPORTED_MODULE_5___default().hideLoading();
                console.error('取消失败:', _t4);
                _tarojs_taro__WEBPACK_IMPORTED_MODULE_5___default().showToast({
                  title: '网络错误',
                  icon: 'none'
                });
              case 4:
                return _context5.a(2);
            }
          }, _callee5, null, [[1, 3]]);
        }));
        function success(_x2) {
          return _success2.apply(this, arguments);
        }
        return success;
      }()
    });
  };
  var formatDate = function formatDate(dateStr) {
    var date = new Date(dateStr);
    return "".concat(date.getMonth() + 1, "\u6708").concat(date.getDate(), "\u65E5 ").concat(date.getHours(), ":").concat(String(date.getMinutes()).padStart(2, '0'));
  };
  var getStatusText = function getStatusText(status) {
    var statusMap = {
      'pending_match': '待匹配',
      'matching': '匹配中',
      'pending_accept': '待接单',
      'in_progress': '进行中',
      'pending_review': '待验收',
      'reviewing': 'AI审核中',
      'pending_payment': '待支付尾款',
      'completed': '已完成',
      'cancelled': '已取消'
    };
    return statusMap[status] || status;
  };
  if (loading) {
    return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
      className: "task-detail-page",
      children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
        className: "loading",
        children: "\u52A0\u8F7D\u4E2D..."
      })
    });
  }
  if (!task) {
    return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
      className: "task-detail-page",
      children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
        className: "empty",
        children: "\u4EFB\u52A1\u4E0D\u5B58\u5728"
      })
    });
  }
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
    className: "task-detail-page",
    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.ScrollView, {
      className: "content",
      scrollY: true,
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
        className: "info-card",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
          className: "card-header",
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
            className: "card-title",
            children: "\u4EFB\u52A1\u4FE1\u606F"
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
            className: "status-badge status-".concat(task.status),
            children: getStatusText(task.status)
          })]
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
          className: "info-row",
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
            className: "info-label",
            children: "\u4EFB\u52A1\u6807\u9898"
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
            className: "info-value",
            children: task.title
          })]
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
          className: "info-row",
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
            className: "info-label",
            children: "\u4EFB\u52A1\u7C7B\u578B"
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
            className: "info-value",
            children: task.taskType
          })]
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
          className: "info-row",
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
            className: "info-label",
            children: "\u4EFB\u52A1\u62A5\u916C"
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
            className: "info-value price",
            children: ["\xA5", task.price]
          })]
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
          className: "info-row",
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
            className: "info-label",
            children: "\u622A\u6B62\u65E5\u671F"
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
            className: "info-value",
            children: formatDate(task.deadline)
          })]
        }), task.studentName && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
          className: "info-row",
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
            className: "info-label",
            children: "\u6267\u884C\u5B66\u751F"
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
            className: "info-value",
            children: task.studentName
          })]
        }), task.progressPercent !== undefined && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
          className: "info-row",
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
            className: "info-label",
            children: "\u4EFB\u52A1\u8FDB\u5EA6"
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
            className: "progress-container",
            children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
              className: "progress-bar",
              children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
                className: "progress-fill",
                style: {
                  width: "".concat(task.progressPercent, "%")
                }
              })
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
              className: "progress-text",
              children: [task.progressPercent, "%"]
            })]
          })]
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
          className: "info-row full",
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
            className: "info-label",
            children: "\u4EFB\u52A1\u63CF\u8FF0"
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
            className: "info-value desc",
            children: task.description
          })]
        })]
      }), deliverable && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
        className: "info-card",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
          className: "card-header",
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
            className: "card-title",
            children: "\u4EA4\u4ED8\u7269"
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
            className: "submit-time",
            children: ["\u63D0\u4EA4\u4E8E ", formatDate(deliverable.submittedAt)]
          })]
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
          className: "deliverable-section",
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
            className: "section-label",
            children: "\u4F5C\u54C1\u8BF4\u660E"
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
            className: "section-content",
            children: deliverable.description
          })]
        }), deliverable.fileUrls && deliverable.fileUrls.length > 0 && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
          className: "deliverable-section",
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
            className: "section-label",
            children: "\u4F5C\u54C1\u622A\u56FE"
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
            className: "image-grid",
            children: deliverable.fileUrls.map(function (url, index) {
              return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Image, {
                src: url,
                className: "deliverable-image",
                mode: "aspectFill",
                onClick: function onClick() {
                  _tarojs_taro__WEBPACK_IMPORTED_MODULE_5___default().previewImage({
                    urls: deliverable.fileUrls,
                    current: url
                  });
                }
              }, index);
            })
          })]
        }), deliverable.links && deliverable.links.length > 0 && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
          className: "deliverable-section",
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
            className: "section-label",
            children: "\u76F8\u5173\u94FE\u63A5"
          }), deliverable.links.map(function (link, index) {
            return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
              className: "link-item",
              onClick: function onClick() {
                _tarojs_taro__WEBPACK_IMPORTED_MODULE_5___default().setClipboardData({
                  data: link
                });
                _tarojs_taro__WEBPACK_IMPORTED_MODULE_5___default().showToast({
                  title: '链接已复制',
                  icon: 'success'
                });
              },
              children: link
            }, index);
          })]
        }), deliverable.aiReviewStatus === 'approved' && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
          className: "review-section ai-review",
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
            className: "review-header",
            children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
              className: "review-title",
              children: "AI\u5BA1\u6838"
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
              className: "review-badge approved",
              children: "\u901A\u8FC7"
            })]
          }), deliverable.aiReviewScore && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
            className: "review-score",
            children: ["\u8BC4\u5206\uFF1A", deliverable.aiReviewScore, "/100"]
          }), deliverable.aiReviewFeedback && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
            className: "review-feedback",
            children: deliverable.aiReviewFeedback
          })]
        }), deliverable.aiReviewStatus === 'rejected' && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
          className: "review-section ai-review",
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
            className: "review-header",
            children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
              className: "review-title",
              children: "AI\u5BA1\u6838"
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
              className: "review-badge rejected",
              children: "\u672A\u901A\u8FC7"
            })]
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
            className: "review-feedback",
            children: deliverable.aiReviewFeedback
          })]
        }), deliverable.companyReviewStatus && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
          className: "review-section company-review",
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
            className: "review-header",
            children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
              className: "review-title",
              children: "\u4F01\u4E1A\u9A8C\u6536"
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
              className: "review-badge ".concat(deliverable.companyReviewStatus),
              children: deliverable.companyReviewStatus === 'approved' ? '通过' : '未通过'
            })]
          }), deliverable.companyReviewFeedback && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
            className: "review-feedback",
            children: deliverable.companyReviewFeedback
          })]
        })]
      })]
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
      className: "quick-actions",
      children: [task.studentId && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
        className: "quick-btn",
        onClick: function onClick() {
          _tarojs_taro__WEBPACK_IMPORTED_MODULE_5___default().navigateTo({
            url: "/pages/student-profile/index?studentId=".concat(task.studentId)
          });
        },
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
          className: "quick-icon-wrapper icon-student"
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
          className: "quick-text",
          children: "\u5B66\u751F\u8D44\u6599"
        })]
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
        className: "quick-btn",
        onClick: function onClick() {
          _tarojs_taro__WEBPACK_IMPORTED_MODULE_5___default().navigateTo({
            url: "/pages/task-progress/index?taskId=".concat(id)
          });
        },
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
          className: "quick-icon-wrapper icon-progress"
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
          className: "quick-text",
          children: "\u4EFB\u52A1\u8FDB\u5EA6"
        })]
      }), task.status === 'in_progress' && task.studentId && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
        className: "quick-btn",
        onClick: function onClick() {
          _tarojs_taro__WEBPACK_IMPORTED_MODULE_5___default().navigateTo({
            url: "/pages/chat-detail/index?taskId=".concat(id, "&studentId=").concat(task.studentId)
          });
        },
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
          className: "quick-icon-wrapper icon-chat"
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
          className: "quick-text",
          children: "\u8054\u7CFB\u5B66\u751F"
        })]
      }), task.status === 'in_progress' && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
        className: "quick-btn",
        onClick: function onClick() {
          _tarojs_taro__WEBPACK_IMPORTED_MODULE_5___default().navigateTo({
            url: "/pages/add-requirement/index?taskId=".concat(id)
          });
        },
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
          className: "quick-icon-wrapper icon-requirement"
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
          className: "quick-text",
          children: "\u8FFD\u52A0\u9700\u6C42"
        })]
      })]
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
      className: "bottom-actions",
      children: [deliverable && deliverable.aiReviewStatus === 'approved' && !deliverable.companyReviewStatus && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
        className: "action-buttons",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Button, {
          className: "btn-reject",
          onClick: function onClick() {
            return handleReview('reject');
          },
          children: "\u62D2\u7EDD"
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Button, {
          className: "btn-approve",
          onClick: function onClick() {
            return handleReview('approve');
          },
          children: "\u9A8C\u6536\u901A\u8FC7"
        })]
      }), deliverable && deliverable.companyReviewStatus === 'approved' && task.status === 'pending_payment' && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Button, {
        className: "btn-pay",
        onClick: handlePayFinal,
        children: ["\u652F\u4ED8\u5C3E\u6B3E (\xA5", (task.price * 0.7).toFixed(2), ")"]
      }), task.status === 'completed' && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Button, {
        className: "btn-confirm",
        onClick: handleConfirm,
        children: "\u786E\u8BA4\u5B8C\u6210"
      }), (task.status === 'pending_match' || task.status === 'matching' || task.status === 'pending_accept' || task.status === 'in_progress') && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Button, {
        className: "btn-cancel",
        onClick: handleCancelTask,
        children: "\u53D6\u6D88\u4EFB\u52A1"
      })]
    }), showReviewModal && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
      className: "review-modal",
      onClick: function onClick() {
        return setShowReviewModal(false);
      },
      children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
        className: "modal-content",
        onClick: function onClick(e) {
          return e.stopPropagation();
        },
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
          className: "modal-header",
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
            className: "modal-title",
            children: reviewAction === 'approve' ? '验收通过' : '拒绝验收'
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
            className: "modal-close",
            onClick: function onClick() {
              return setShowReviewModal(false);
            },
            children: "\xD7"
          })]
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
          className: "modal-body",
          children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
            className: "form-item",
            children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
              className: "form-label",
              children: reviewAction === 'approve' ? '验收意见（选填）' : '拒绝原因（必填）'
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)("textarea", {
              className: "form-textarea",
              value: reviewFeedback,
              onInput: function onInput(e) {
                return setReviewFeedback(e.detail.value);
              },
              placeholder: reviewAction === 'approve' ? '可以填写对学生的评价和建议...' : '请说明拒绝的原因，以便学生改进...',
              maxlength: 500
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
              className: "char-count",
              children: [reviewFeedback.length, "/500"]
            })]
          })
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
          className: "modal-footer",
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Button, {
            className: "modal-btn cancel",
            onClick: function onClick() {
              return setShowReviewModal(false);
            },
            children: "\u53D6\u6D88"
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Button, {
            className: "modal-btn confirm",
            onClick: handleSubmitReview,
            children: ["\u786E\u8BA4", reviewAction === 'approve' ? '通过' : '拒绝']
          })]
        })]
      })
    })]
  });
}

/***/ }),

/***/ "./src/pages/task-detail/index.tsx":
/*!*****************************************!*\
  !*** ./src/pages/task-detail/index.tsx ***!
  \*****************************************/
/***/ (function(__unused_webpack_module, __unused_webpack___webpack_exports__, __webpack_require__) {

/* harmony import */ var _tarojs_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @tarojs/runtime */ "webpack/container/remote/@tarojs/runtime");
/* harmony import */ var _tarojs_runtime__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_tarojs_runtime__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _node_modules_tarojs_taro_loader_lib_entry_cache_js_name_pages_task_detail_index_index_tsx__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! !!../../../node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=pages/task-detail/index!./index.tsx */ "./node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=pages/task-detail/index!./src/pages/task-detail/index.tsx");


var config = {};


var inst = Page((0,_tarojs_runtime__WEBPACK_IMPORTED_MODULE_0__.createPageConfig)(_node_modules_tarojs_taro_loader_lib_entry_cache_js_name_pages_task_detail_index_index_tsx__WEBPACK_IMPORTED_MODULE_1__["default"], 'pages/task-detail/index', {root:{cn:[]}}, config || {}))


/* unused harmony default export */ var __WEBPACK_DEFAULT_EXPORT__ = (_node_modules_tarojs_taro_loader_lib_entry_cache_js_name_pages_task_detail_index_index_tsx__WEBPACK_IMPORTED_MODULE_1__["default"]);


/***/ })

},
/******/ function(__webpack_require__) { // webpackRuntimeModules
/******/ var __webpack_exec__ = function(moduleId) { return __webpack_require__(__webpack_require__.s = moduleId); }
/******/ __webpack_require__.O(0, ["taro","vendors","common"], function() { return __webpack_exec__("./src/pages/task-detail/index.tsx"); });
/******/ var __webpack_exports__ = __webpack_require__.O();
/******/ }
]);
//# sourceMappingURL=index.js.map