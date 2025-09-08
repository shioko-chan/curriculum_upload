Page({
  data: {
    useraccessToken: "",
    calendarId: "",
  },
  onLoad: function () {
    let that = this;
    tt.request({
      url: "https://open.feishu.cn/open-apis/auth/v3/app_access_token/internal",
      header: {
        "Content-Type": "application/json; charset=utf-8",
      },
      data: {
        app_id: "cli_a5b890b159b3500b",
        app_secret: "KHhxssXJRm585eV9s0igYc5VrAvHLIec",
      },
      method: "POST",
      success(res) {
        app_access_token = res.data.app_access_token;
        tt.login({
          success(res) {
            code = res.code;
            tt.request({
              url: "https://open.feishu.cn/open-apis/mina/v2/tokenLoginValidate",
              method: "POST",
              header: {
                Authorization: app_access_token,
                "Content-Type": "application/json; charset=utf-8",
              },
              data: {
                code: code,
              },
              success(res) {
                that.useraccessToken = res.data.data.access_token;
                tt.request({
                  url: "https://open.feishu.cn/open-apis/calendar/v4/calendars/primary",
                  method: "POST",
                  header: {
                    Authorization: "Bearer " + that.useraccessToken,
                  },
                  data: {
                    user_id_type: "open_id",
                  },
                  success(res) {
                    that.calendarId =
                      res.data.data.calendars[0].calendar.calendar_id;
                  },
                  fail(_) {},
                });
              },
              fail(_) {},
            });
          },
          fail(_) {
            tt.showToast({
              title: "登录失败",
              duration: 3000,
              icon: "error",
            });
          },
        });
      },
      fail(_) {},
    });
  },
  upload: async function () {
    const pickFile = () => {
      return new Promise((resolve, reject) => {
        tt.filePicker({
          isSystem: true,
          success(res) {
            resolve(res);
          },
          fail(res) {
            reject(res);
          },
        });
      });
    };
    const readFile = (res) => {
      return new Promise((resolve, reject) => {
        const fs = tt.getFileSystemManager();
        fs.readFile({
          filePath: res.list[0].path,
          encoding: "utf-8",
          success(res) {
            resolve(res);
          },
          fail(res) {
            reject(res);
          },
        });
      });
    };
    const processCalendar = (res) => {
      let that = this;
      const SEC_A_MINUTE = 60;
      const SEC_AN_HOUR = 60 * SEC_A_MINUTE;
      const SEC_A_DAY = 24 * SEC_AN_HOUR;
      const SEC_A_WEEK = 7 * SEC_A_DAY;
      const LESSON_DURATION = 45 * SEC_A_MINUTE;
      function count_seconds(hour, minute) {
        return hour * SEC_AN_HOUR + minute * SEC_A_MINUTE;
      }
      const SEMESTER_FIRST_DATE = Date.parse("2025/9/1") / 1000; // ⚠⚠每个新学期都要注意更改这里，设置为该学期第一周周一的日期
      const LESSON_BEGIN = [
        count_seconds(8, 0),
        count_seconds(8, 55),
        count_seconds(10, 10),
        count_seconds(11, 5),
        count_seconds(14, 30),
        count_seconds(15, 25),
        count_seconds(16, 40),
        count_seconds(17, 35),
        count_seconds(19, 10),
        count_seconds(20, 5),
        count_seconds(21, 0),
      ];
      let html = res.data;
      let list = html.slice(
        html.search("<tbody>") + 7,
        html.search("</tbody>")
      );
      let cnt = 0;
      let request_queue = new Array();
      while (list.search("<tr>") != -1) {
        let tr = list.slice(list.search("<tr>") + 4, list.search("</tr>"));
        if (cnt != 0) {
          let cnt1 = 0;
          while (tr.search("<td") != -1) {
            let td = tr.slice(tr.search("<td") + 4, tr.search("</td>"));
            if (cnt1 > 1) {
              if (td.search("<div") != -1) {
                let jcxq = td
                  .slice(td.search("jcxq=") + 6, td.search("jcxq=") + 10)
                  .split("-");
                let jc = parseInt(jcxq[0]);
                let xq = parseInt(jcxq[1]);
                while (td.search("<div") != -1) {
                  let div = td.slice(td.search("<div") + 5);
                  let array = new Array();
                  for (let i = 0; i < 4; ++i) {
                    array.push(
                      div.slice(div.search("<div>") + 5, div.search("</div>"))
                    );
                    div = div.slice(div.search("</div>") + 6);
                  }
                  let time = 0;
                  if (
                    array[0].search("单") != -1 ||
                    array[0].search("双") != -1
                  ) {
                    time = 2;
                  } else {
                    time = 1;
                  }
                  td = div;
                  let ft = array[0].slice(0, array[0].search("周")).split("-");
                  request_queue.push({
                    header: {
                      Authorization: "Bearer " + that.useraccessToken,
                      "Content-Type": "application/json; charset=utf-8",
                    },
                    url:
                      "https://open.feishu.cn/open-apis/calendar/v4/calendars/" +
                      that.calendarId +
                      "/events",
                    data: {
                      summary: array[1],
                      description: array[0] + " " + array[1] + " " + array[2],
                      need_notification: false,
                      start_time: {
                        timestamp: (
                          SEMESTER_FIRST_DATE +
                          LESSON_BEGIN[jc - 1] +
                          SEC_A_WEEK * (parseInt(ft[0]) - 1) +
                          (xq - 1) * SEC_A_DAY
                        ).toString(),
                        timezone: "Asia/Shanghai", // 我认为没有其他时区的人用这个小程序
                      },
                      end_time: {
                        timestamp: (
                          SEMESTER_FIRST_DATE +
                          LESSON_BEGIN[jc - 1] +
                          SEC_A_WEEK * (parseInt(ft[0]) - 1) +
                          (xq - 1) * SEC_A_DAY +
                          LESSON_DURATION
                        ).toString(),
                        timezone: "Asia/Shanghai",
                      },
                      visibility: "default",
                      attendee_ability: "can_see_others",
                      free_busy_status: "busy",
                      location: {
                        name: array[3],
                      },
                      color: -1,
                      recurrence:
                        "FREQ=WEEKLY;INTERVAL=" +
                        time +
                        ";COUNT=" +
                        (parseInt((parseInt(ft[1]) - parseInt(ft[0])) / time) +
                          1),
                    },
                    method: "POST",
                    success(_) {},
                    fail(_) {},
                  });
                }
              }
            }
            tr = tr.slice(tr.search("</td>") + 5);
            cnt1++;
          }
        }
        list = list.slice(list.search("</tr>") + 5);
        cnt++;
      }
      return request_queue;
    };
    const sleep = (ms) =>
      new Promise((resolve) => {
        setTimeout(resolve, ms);
      });
    let res;
    try {
      res = await pickFile();
    } catch (e) {
      tt.showToast({
        title: "未能成功选择文件，请重试",
        duration: 3000,
        icon: "error",
      });
      return;
    }
    tt.showLoading({
      title: "读取文件中...",
      mask: true,
    });
    try {
      res = await readFile(res);
    } catch (e) {
      tt.showToast({
        title: "读取文件时出错，请检查文件格式",
        duration: 3000,
        icon: "error",
      });
      return;
    }
    tt.showLoading({
      title: "解析课表中...",
      mask: true,
    });
    let reqs = processCalendar(res);
    if (reqs.length <= 0) {
      tt.showToast({
        title: "在上传文件中未能解析到课表",
        duration: 3000,
        icon: "error",
      });
      return;
    }
    tt.showLoading({
      title: "上传课表中...",
      mask: true,
    });
    for (let req of reqs) {
      tt.request(req);
      await sleep(125);
    }
    tt.hideLoading();
    tt.showToast({
      title: "上传成功，请在日历中查看",
      duration: 3000,
      icon: "success",
    });
  },
});
