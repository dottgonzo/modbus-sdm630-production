"use strict";
var ModbusRTU = require("modbus-serial");
var merge = require("json-add");
var Promise = require("bluebird");
var async = require("async");
var lsusbdev = require("lsusbdev");
var rpj = require("request-promise-json");
var defaults = {
    baud: 9600,
    dev: "/dev/ttyUSB0",
    address: 1,
    type: "import"
};
function readReg(client, reg) {
    return new Promise(function (resolve, reject) {
        client.readInputRegisters(reg, 2).then(function (data) {
            resolve(data.buffer.readFloatBE());
        }).catch(function (err) {
            reject(err);
        });
    });
}
var SdM = (function () {
    function SdM(conf) {
        this.validDate = false;
        this.checkDate();
        this.client = new ModbusRTU();
        var that = this;
        if (conf) {
            merge(defaults, conf);
            that.client.setID(defaults.address);
            if (conf.hub) {
                lsusbdev().then(function (devis) {
                    for (var i = 0; i < devis.length; i++) {
                        if (devis[i].hub === conf.hub) {
                            defaults.dev = devis[i].dev;
                        }
                    }
                    that.conf = defaults;
                }).catch(function () {
                    throw "NO USB FOR SDM";
                });
            }
            else {
                that.conf = defaults;
            }
        }
        else {
            that.client.setID(defaults.address);
            that.conf = defaults;
        }
    }
    SdM.prototype.last = function () {
        return this.latest;
    };
    SdM.prototype.data = function (callback, interval) {
        var regs;
        if (this.conf.type === "import") {
            regs = [
                {
                    label: "voltage",
                    phase: 1,
                    reg: 0,
                    group: "strings"
                },
                {
                    label: "voltage",
                    phase: 2,
                    reg: 2,
                    group: "strings"
                },
                {
                    label: "voltage",
                    phase: 3,
                    reg: 4,
                    group: "strings"
                },
                {
                    label: "current",
                    phase: 1,
                    reg: 6,
                    group: "strings"
                },
                {
                    label: "current",
                    phase: 2,
                    reg: 8,
                    group: "strings"
                },
                {
                    label: "current",
                    phase: 3,
                    reg: 10,
                    group: "strings"
                },
                {
                    label: "power",
                    phase: 1,
                    reg: 12,
                    group: "strings"
                },
                {
                    label: "power",
                    phase: 2,
                    reg: 14,
                    group: "strings"
                },
                {
                    label: "power",
                    phase: 3,
                    reg: 16,
                    group: "strings"
                },
                {
                    label: "hz",
                    phase: 0,
                    reg: 70,
                    group: "grid"
                },
                {
                    label: "power",
                    phase: 0,
                    reg: 52,
                    group: "grid"
                },
                {
                    label: "voltage",
                    phase: 0,
                    reg: 42,
                    group: "grid"
                },
                {
                    label: "current",
                    phase: 0,
                    reg: 46,
                    group: "grid"
                },
                {
                    label: "peakMax",
                    phase: 0,
                    reg: 86,
                    group: "main"
                },
                {
                    label: "totalEnergy",
                    phase: 0,
                    reg: 72,
                    group: "main"
                }
            ];
        }
        else if (this.conf.type === "export") {
            regs = [
                {
                    label: "voltage",
                    phase: 1,
                    reg: 0,
                    group: "strings"
                },
                {
                    label: "voltage",
                    phase: 2,
                    reg: 2,
                    group: "strings"
                },
                {
                    label: "voltage",
                    phase: 3,
                    reg: 4,
                    group: "strings"
                },
                {
                    label: "current",
                    phase: 1,
                    reg: 6,
                    group: "strings"
                },
                {
                    label: "current",
                    phase: 2,
                    reg: 8,
                    group: "strings"
                },
                {
                    label: "current",
                    phase: 3,
                    reg: 10,
                    group: "strings"
                },
                {
                    label: "power",
                    phase: 1,
                    reg: 12,
                    group: "strings"
                },
                {
                    label: "power",
                    phase: 2,
                    reg: 14,
                    group: "strings"
                },
                {
                    label: "power",
                    phase: 3,
                    reg: 16,
                    group: "strings"
                },
                {
                    label: "hz",
                    phase: 0,
                    reg: 70,
                    group: "grid"
                },
                {
                    label: "power",
                    phase: 0,
                    reg: 52,
                    group: "grid"
                },
                {
                    label: "voltage",
                    phase: 0,
                    reg: 42,
                    group: "grid"
                },
                {
                    label: "current",
                    phase: 0,
                    reg: 46,
                    group: "grid"
                },
                {
                    label: "peakMax",
                    phase: 0,
                    reg: 86,
                    group: "main"
                },
                {
                    label: "totalEnergy",
                    phase: 0,
                    reg: 74,
                    group: "main"
                }
            ];
        }
        var that = this;
        function start() {
            var answer = {
                uid: that.conf.uid,
                grid: {},
                strings: [],
                updatedAt: new Date().getTime(),
                date: new Date().getTime()
            };
            async.eachSeries(regs, function (iterator, cb) {
                readReg(that.client, iterator.reg).then(function (d) {
                    if (iterator.group === "strings") {
                        if (!answer.strings[iterator.phase - 1]) {
                            answer.strings[iterator.phase - 1] = {};
                        }
                        answer.strings[iterator.phase - 1][iterator.label] = d;
                    }
                    else if (iterator.group === "grid") {
                        answer.grid[iterator.label] = d;
                    }
                    else if (iterator.group === "main") {
                        answer[iterator.label] = d;
                    }
                    cb();
                }).catch(function (err) {
                    cb(err);
                });
            }, function (err) {
                if (err) {
                    console.log(err);
                }
                else if (answer.grid.power && answer.grid.power > 0 && that.validDate) {
                    if (callback) {
                        callback(answer);
                    }
                    that.latest = answer;
                }
                else {
                    console.log(answer);
                    console.log("malformed data");
                }
            });
        }
        if (interval) {
            setInterval(function () {
                that.client.connectRTU(that.conf.dev, { baudrate: that.conf.baud }, start);
            }, interval);
        }
        else {
            that.client.connectRTU(that.conf.dev, { baudrate: that.conf.baud }, start);
        }
    };
    SdM.prototype.checkDate = function () {
        var that = this;
        function checkRemote() {
            rpj.get("https://io.kernel.online/date").then(function (date) {
                console.log(date);
                if (new Date().getTime() > (date.unixtime - 90000)) {
                    console.log("valid");
                    that.validDate = true;
                }
                else {
                    checkRemote();
                }
            }).catch(function (err) {
                console.log(err);
                checkRemote();
            });
        }
        checkRemote();
    };
    return SdM;
}());
module.exports = SdM;

//# sourceMappingURL=data:application/json;base64,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QUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUVsQixFQUFFLENBQUMsQ0FBQyxJQUFJLElBQUksRUFBRSxDQUFDLE9BQU8sRUFBRSxHQUFHLENBQUMsSUFBSSxDQUFDLFFBQVEsR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7b0JBQ2pELE9BQU8sQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUM7b0JBQ3JCLElBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDO2dCQUMxQixDQUFDO2dCQUFDLElBQUksQ0FBQyxDQUFDO29CQUNKLFdBQVcsRUFBRSxDQUFDO2dCQUNsQixDQUFDO1lBRUwsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLFVBQVMsR0FBRztnQkFDakIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztnQkFDakIsV0FBVyxFQUFFLENBQUM7WUFDbEIsQ0FBQyxDQUFDLENBQUM7UUFDUCxDQUFDO1FBRVQsV0FBVyxFQUFFLENBQUM7SUFDVixDQUFDO0lBQ0wsVUFBQztBQUFELENBL1VBLEFBK1VDLElBQUE7QUFLRCxpQkFBUyxHQUFHLENBQUEiLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VzQ29udGVudCI6WyJsZXQgTW9kYnVzUlRVID0gcmVxdWlyZShcIm1vZGJ1cy1zZXJpYWxcIik7XG5pbXBvcnQgKiBhcyBwYXRoRXhpc3RzIGZyb20gXCJwYXRoLWV4aXN0c1wiO1xuaW1wb3J0IG1lcmdlID0gcmVxdWlyZShcImpzb24tYWRkXCIpO1xuaW1wb3J0ICogYXMgUHJvbWlzZSBmcm9tIFwiYmx1ZWJpcmRcIjtcbmltcG9ydCAqIGFzIGFzeW5jIGZyb20gXCJhc3luY1wiO1xuXG5pbXBvcnQgbHN1c2JkZXYgPSByZXF1aXJlKFwibHN1c2JkZXZcIik7XG5cbmxldCBycGogPSByZXF1aXJlKFwicmVxdWVzdC1wcm9taXNlLWpzb25cIik7XG5cbmludGVyZmFjZSBJY29uZiB7XG4gICAgYmF1ZD86IG51bWJlcjtcbiAgICBkZXY/OiBzdHJpbmc7XG4gICAgYWRkcmVzcz86IG51bWJlcjtcbiAgICBodWI/OiBzdHJpbmc7XG4gICAgdHlwZT86IHN0cmluZztcbiAgICB1aWQ6IHN0cmluZztcbn1cblxuaW50ZXJmYWNlIElkZWZhdWx0cyB7XG4gICAgYmF1ZDogbnVtYmVyO1xuICAgIGRldjogc3RyaW5nO1xuICAgIGFkZHJlc3M6IG51bWJlcjtcbiAgICB0eXBlOiBzdHJpbmc7XG4gICAgdWlkOiBzdHJpbmc7XG4gICAgaHViPzogc3RyaW5nO1xufVxuXG5sZXQgZGVmYXVsdHMgPSA8SWRlZmF1bHRzPntcbiAgICBiYXVkOiA5NjAwLFxuICAgIGRldjogXCIvZGV2L3R0eVVTQjBcIixcbiAgICBhZGRyZXNzOiAxLFxuICAgIHR5cGU6IFwiaW1wb3J0XCJcbn07XG5cbmludGVyZmFjZSBJcmVnIHtcbiAgICBsYWJlbDogc3RyaW5nO1xuICAgIHBoYXNlOiBudW1iZXI7XG4gICAgcmVnOiBudW1iZXI7XG4gICAgZ3JvdXA6IHN0cmluZztcbn1cblxuXG5mdW5jdGlvbiByZWFkUmVnKGNsaWVudCwgcmVnOiBudW1iZXIpIHtcblxuXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgICBjbGllbnQucmVhZElucHV0UmVnaXN0ZXJzKHJlZywgMikudGhlbihmdW5jdGlvbihkYXRhKSB7XG5cblxuICAgICAgICAgICAgcmVzb2x2ZShkYXRhLmJ1ZmZlci5yZWFkRmxvYXRCRSgpKTtcbiAgICAgICAgfSkuY2F0Y2goZnVuY3Rpb24oZXJyKSB7XG4gICAgICAgICAgICByZWplY3QoZXJyKTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG5cbn1cblxuXG5jbGFzcyBTZE0ge1xuICAgIGNsaWVudDtcbiAgICBsYXRlc3Q7XG4gICAgY29uZjogSWNvbmY7XG4gICAgdmFsaWREYXRlOiBib29sZWFuO1xuICAgIGNvbnN0cnVjdG9yKGNvbmY/OiBJY29uZikge1xuICAgICAgICB0aGlzLnZhbGlkRGF0ZSA9IGZhbHNlO1xuICAgICAgICB0aGlzLmNoZWNrRGF0ZSgpO1xuICAgICAgICB0aGlzLmNsaWVudCA9IG5ldyBNb2RidXNSVFUoKTtcbiAgICAgICAgbGV0IHRoYXQgPSB0aGlzO1xuICAgICAgICBpZiAoY29uZikge1xuXG4gICAgICAgICAgICBtZXJnZShkZWZhdWx0cywgY29uZik7XG5cbiAgICAgICAgICAgIHRoYXQuY2xpZW50LnNldElEKGRlZmF1bHRzLmFkZHJlc3MpO1xuXG5cbiAgICAgICAgICAgIGlmIChjb25mLmh1Yikge1xuICAgICAgICAgICAgICAgIGxzdXNiZGV2KCkudGhlbihmdW5jdGlvbihkZXZpcykge1xuXG4gICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZGV2aXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChkZXZpc1tpXS5odWIgPT09IGNvbmYuaHViKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVmYXVsdHMuZGV2ID0gZGV2aXNbaV0uZGV2O1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHRoYXQuY29uZiA9IGRlZmF1bHRzO1xuICAgICAgICAgICAgICAgIH0pLmNhdGNoKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBcIk5PIFVTQiBGT1IgU0RNXCI7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoYXQuY29uZiA9IGRlZmF1bHRzO1xuXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoYXQuY2xpZW50LnNldElEKGRlZmF1bHRzLmFkZHJlc3MpO1xuICAgICAgICAgICAgdGhhdC5jb25mID0gZGVmYXVsdHM7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBsYXN0KCkge1xuICAgICAgICByZXR1cm4gdGhpcy5sYXRlc3Q7XG4gICAgfVxuXG4gICAgZGF0YShjYWxsYmFjaz86IEZ1bmN0aW9uLCBpbnRlcnZhbD86IG51bWJlcikge1xuXG4gICAgICAgIGxldCByZWdzOiBJcmVnW107XG5cbiAgICAgICAgaWYgKHRoaXMuY29uZi50eXBlID09PSBcImltcG9ydFwiKSB7XG4gICAgICAgICAgICByZWdzID0gW1xuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgbGFiZWw6IFwidm9sdGFnZVwiLFxuICAgICAgICAgICAgICAgICAgICBwaGFzZTogMSxcbiAgICAgICAgICAgICAgICAgICAgcmVnOiAwLFxuICAgICAgICAgICAgICAgICAgICBncm91cDogXCJzdHJpbmdzXCJcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgbGFiZWw6IFwidm9sdGFnZVwiLFxuICAgICAgICAgICAgICAgICAgICBwaGFzZTogMixcbiAgICAgICAgICAgICAgICAgICAgcmVnOiAyLFxuICAgICAgICAgICAgICAgICAgICBncm91cDogXCJzdHJpbmdzXCJcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgbGFiZWw6IFwidm9sdGFnZVwiLFxuICAgICAgICAgICAgICAgICAgICBwaGFzZTogMyxcbiAgICAgICAgICAgICAgICAgICAgcmVnOiA0LFxuICAgICAgICAgICAgICAgICAgICBncm91cDogXCJzdHJpbmdzXCJcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgbGFiZWw6IFwiY3VycmVudFwiLFxuICAgICAgICAgICAgICAgICAgICBwaGFzZTogMSxcbiAgICAgICAgICAgICAgICAgICAgcmVnOiA2LFxuICAgICAgICAgICAgICAgICAgICBncm91cDogXCJzdHJpbmdzXCJcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgbGFiZWw6IFwiY3VycmVudFwiLFxuICAgICAgICAgICAgICAgICAgICBwaGFzZTogMixcbiAgICAgICAgICAgICAgICAgICAgcmVnOiA4LFxuICAgICAgICAgICAgICAgICAgICBncm91cDogXCJzdHJpbmdzXCJcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgbGFiZWw6IFwiY3VycmVudFwiLFxuICAgICAgICAgICAgICAgICAgICBwaGFzZTogMyxcbiAgICAgICAgICAgICAgICAgICAgcmVnOiAxMCxcbiAgICAgICAgICAgICAgICAgICAgZ3JvdXA6IFwic3RyaW5nc1wiXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGxhYmVsOiBcInBvd2VyXCIsXG4gICAgICAgICAgICAgICAgICAgIHBoYXNlOiAxLFxuICAgICAgICAgICAgICAgICAgICByZWc6IDEyLFxuICAgICAgICAgICAgICAgICAgICBncm91cDogXCJzdHJpbmdzXCJcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgbGFiZWw6IFwicG93ZXJcIixcbiAgICAgICAgICAgICAgICAgICAgcGhhc2U6IDIsXG4gICAgICAgICAgICAgICAgICAgIHJlZzogMTQsXG4gICAgICAgICAgICAgICAgICAgIGdyb3VwOiBcInN0cmluZ3NcIlxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBsYWJlbDogXCJwb3dlclwiLFxuICAgICAgICAgICAgICAgICAgICBwaGFzZTogMyxcbiAgICAgICAgICAgICAgICAgICAgcmVnOiAxNixcbiAgICAgICAgICAgICAgICAgICAgZ3JvdXA6IFwic3RyaW5nc1wiXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGxhYmVsOiBcImh6XCIsXG4gICAgICAgICAgICAgICAgICAgIHBoYXNlOiAwLFxuICAgICAgICAgICAgICAgICAgICByZWc6IDcwLFxuICAgICAgICAgICAgICAgICAgICBncm91cDogXCJncmlkXCJcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgbGFiZWw6IFwicG93ZXJcIixcbiAgICAgICAgICAgICAgICAgICAgcGhhc2U6IDAsXG4gICAgICAgICAgICAgICAgICAgIHJlZzogNTIsXG4gICAgICAgICAgICAgICAgICAgIGdyb3VwOiBcImdyaWRcIlxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBsYWJlbDogXCJ2b2x0YWdlXCIsXG4gICAgICAgICAgICAgICAgICAgIHBoYXNlOiAwLFxuICAgICAgICAgICAgICAgICAgICByZWc6IDQyLFxuICAgICAgICAgICAgICAgICAgICBncm91cDogXCJncmlkXCJcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgbGFiZWw6IFwiY3VycmVudFwiLFxuICAgICAgICAgICAgICAgICAgICBwaGFzZTogMCxcbiAgICAgICAgICAgICAgICAgICAgcmVnOiA0NixcbiAgICAgICAgICAgICAgICAgICAgZ3JvdXA6IFwiZ3JpZFwiXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGxhYmVsOiBcInBlYWtNYXhcIixcbiAgICAgICAgICAgICAgICAgICAgcGhhc2U6IDAsXG4gICAgICAgICAgICAgICAgICAgIHJlZzogODYsXG4gICAgICAgICAgICAgICAgICAgIGdyb3VwOiBcIm1haW5cIlxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBsYWJlbDogXCJ0b3RhbEVuZXJneVwiLFxuICAgICAgICAgICAgICAgICAgICBwaGFzZTogMCxcbiAgICAgICAgICAgICAgICAgICAgcmVnOiA3MixcbiAgICAgICAgICAgICAgICAgICAgZ3JvdXA6IFwibWFpblwiXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgXTtcbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLmNvbmYudHlwZSA9PT0gXCJleHBvcnRcIikge1xuICAgICAgICAgICAgcmVncyA9IFtcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGxhYmVsOiBcInZvbHRhZ2VcIixcbiAgICAgICAgICAgICAgICAgICAgcGhhc2U6IDEsXG4gICAgICAgICAgICAgICAgICAgIHJlZzogMCxcbiAgICAgICAgICAgICAgICAgICAgZ3JvdXA6IFwic3RyaW5nc1wiXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGxhYmVsOiBcInZvbHRhZ2VcIixcbiAgICAgICAgICAgICAgICAgICAgcGhhc2U6IDIsXG4gICAgICAgICAgICAgICAgICAgIHJlZzogMixcbiAgICAgICAgICAgICAgICAgICAgZ3JvdXA6IFwic3RyaW5nc1wiXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGxhYmVsOiBcInZvbHRhZ2VcIixcbiAgICAgICAgICAgICAgICAgICAgcGhhc2U6IDMsXG4gICAgICAgICAgICAgICAgICAgIHJlZzogNCxcbiAgICAgICAgICAgICAgICAgICAgZ3JvdXA6IFwic3RyaW5nc1wiXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGxhYmVsOiBcImN1cnJlbnRcIixcbiAgICAgICAgICAgICAgICAgICAgcGhhc2U6IDEsXG4gICAgICAgICAgICAgICAgICAgIHJlZzogNixcbiAgICAgICAgICAgICAgICAgICAgZ3JvdXA6IFwic3RyaW5nc1wiXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGxhYmVsOiBcImN1cnJlbnRcIixcbiAgICAgICAgICAgICAgICAgICAgcGhhc2U6IDIsXG4gICAgICAgICAgICAgICAgICAgIHJlZzogOCxcbiAgICAgICAgICAgICAgICAgICAgZ3JvdXA6IFwic3RyaW5nc1wiXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGxhYmVsOiBcImN1cnJlbnRcIixcbiAgICAgICAgICAgICAgICAgICAgcGhhc2U6IDMsXG4gICAgICAgICAgICAgICAgICAgIHJlZzogMTAsXG4gICAgICAgICAgICAgICAgICAgIGdyb3VwOiBcInN0cmluZ3NcIlxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBsYWJlbDogXCJwb3dlclwiLFxuICAgICAgICAgICAgICAgICAgICBwaGFzZTogMSxcbiAgICAgICAgICAgICAgICAgICAgcmVnOiAxMixcbiAgICAgICAgICAgICAgICAgICAgZ3JvdXA6IFwic3RyaW5nc1wiXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGxhYmVsOiBcInBvd2VyXCIsXG4gICAgICAgICAgICAgICAgICAgIHBoYXNlOiAyLFxuICAgICAgICAgICAgICAgICAgICByZWc6IDE0LFxuICAgICAgICAgICAgICAgICAgICBncm91cDogXCJzdHJpbmdzXCJcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgbGFiZWw6IFwicG93ZXJcIixcbiAgICAgICAgICAgICAgICAgICAgcGhhc2U6IDMsXG4gICAgICAgICAgICAgICAgICAgIHJlZzogMTYsXG4gICAgICAgICAgICAgICAgICAgIGdyb3VwOiBcInN0cmluZ3NcIlxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBsYWJlbDogXCJoelwiLFxuICAgICAgICAgICAgICAgICAgICBwaGFzZTogMCxcbiAgICAgICAgICAgICAgICAgICAgcmVnOiA3MCxcbiAgICAgICAgICAgICAgICAgICAgZ3JvdXA6IFwiZ3JpZFwiXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGxhYmVsOiBcInBvd2VyXCIsXG4gICAgICAgICAgICAgICAgICAgIHBoYXNlOiAwLFxuICAgICAgICAgICAgICAgICAgICByZWc6IDUyLFxuICAgICAgICAgICAgICAgICAgICBncm91cDogXCJncmlkXCJcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgbGFiZWw6IFwidm9sdGFnZVwiLFxuICAgICAgICAgICAgICAgICAgICBwaGFzZTogMCxcbiAgICAgICAgICAgICAgICAgICAgcmVnOiA0MixcbiAgICAgICAgICAgICAgICAgICAgZ3JvdXA6IFwiZ3JpZFwiXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGxhYmVsOiBcImN1cnJlbnRcIixcbiAgICAgICAgICAgICAgICAgICAgcGhhc2U6IDAsXG4gICAgICAgICAgICAgICAgICAgIHJlZzogNDYsXG4gICAgICAgICAgICAgICAgICAgIGdyb3VwOiBcImdyaWRcIlxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBsYWJlbDogXCJwZWFrTWF4XCIsXG4gICAgICAgICAgICAgICAgICAgIHBoYXNlOiAwLFxuICAgICAgICAgICAgICAgICAgICByZWc6IDg2LFxuICAgICAgICAgICAgICAgICAgICBncm91cDogXCJtYWluXCJcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgbGFiZWw6IFwidG90YWxFbmVyZ3lcIixcbiAgICAgICAgICAgICAgICAgICAgcGhhc2U6IDAsXG4gICAgICAgICAgICAgICAgICAgIHJlZzogNzQsXG4gICAgICAgICAgICAgICAgICAgIGdyb3VwOiBcIm1haW5cIlxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIF07XG4gICAgICAgIH1cblxuXG5cblxuXG4gICAgICAgIGxldCB0aGF0ID0gdGhpcztcblxuXG4gICAgICAgIGZ1bmN0aW9uIHN0YXJ0KCkge1xuXG5cblxuXG4gICAgICAgICAgICBsZXQgYW5zd2VyID0gPGFueT57XG4gICAgICAgICAgICAgICAgdWlkOiB0aGF0LmNvbmYudWlkLFxuICAgICAgICAgICAgICAgIGdyaWQ6IHt9LFxuICAgICAgICAgICAgICAgIHN0cmluZ3M6IFtdLFxuICAgICAgICAgICAgICAgIHVwZGF0ZWRBdDogbmV3IERhdGUoKS5nZXRUaW1lKCksXG4gICAgICAgICAgICAgICAgZGF0ZTogbmV3IERhdGUoKS5nZXRUaW1lKClcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIGFzeW5jLmVhY2hTZXJpZXMocmVncywgZnVuY3Rpb24oaXRlcmF0b3IsIGNiKSB7XG5cbiAgICAgICAgICAgICAgICByZWFkUmVnKHRoYXQuY2xpZW50LCBpdGVyYXRvci5yZWcpLnRoZW4oZnVuY3Rpb24oZCkge1xuXG4gICAgICAgICAgICAgICAgICAgIGlmIChpdGVyYXRvci5ncm91cCA9PT0gXCJzdHJpbmdzXCIpIHtcblxuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWFuc3dlci5zdHJpbmdzW2l0ZXJhdG9yLnBoYXNlIC0gMV0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhbnN3ZXIuc3RyaW5nc1tpdGVyYXRvci5waGFzZSAtIDFdID0ge307XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBhbnN3ZXIuc3RyaW5nc1tpdGVyYXRvci5waGFzZSAtIDFdW2l0ZXJhdG9yLmxhYmVsXSA9IGQ7XG5cbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChpdGVyYXRvci5ncm91cCA9PT0gXCJncmlkXCIpIHtcblxuICAgICAgICAgICAgICAgICAgICAgICAgYW5zd2VyLmdyaWRbaXRlcmF0b3IubGFiZWxdID0gZDtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChpdGVyYXRvci5ncm91cCA9PT0gXCJtYWluXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFuc3dlcltpdGVyYXRvci5sYWJlbF0gPSBkO1xuICAgICAgICAgICAgICAgICAgICB9XG5cblxuICAgICAgICAgICAgICAgICAgICBjYigpO1xuICAgICAgICAgICAgICAgIH0pLmNhdGNoKGZ1bmN0aW9uKGVycikge1xuICAgICAgICAgICAgICAgICAgICBjYihlcnIpO1xuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICB9LCBmdW5jdGlvbihlcnIpIHtcblxuICAgICAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coZXJyKTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGFuc3dlci5ncmlkLnBvd2VyICYmIGFuc3dlci5ncmlkLnBvd2VyID4gMCAmJiB0aGF0LnZhbGlkRGF0ZSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoY2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKGFuc3dlcik7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgdGhhdC5sYXRlc3QgPSBhbnN3ZXI7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcblxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhhbnN3ZXIpO1xuXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwibWFsZm9ybWVkIGRhdGFcIik7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB9KTtcblxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGludGVydmFsKSB7XG4gICAgICAgICAgICBzZXRJbnRlcnZhbChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICB0aGF0LmNsaWVudC5jb25uZWN0UlRVKHRoYXQuY29uZi5kZXYsIHsgYmF1ZHJhdGU6IHRoYXQuY29uZi5iYXVkIH0sIHN0YXJ0KTtcblxuICAgICAgICAgICAgfSwgaW50ZXJ2YWwpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhhdC5jbGllbnQuY29ubmVjdFJUVSh0aGF0LmNvbmYuZGV2LCB7IGJhdWRyYXRlOiB0aGF0LmNvbmYuYmF1ZCB9LCBzdGFydCk7XG5cbiAgICAgICAgfVxuXG5cbiAgICB9XG4gICAgY2hlY2tEYXRlKCkge1xuICAgICAgICBsZXQgdGhhdCA9IHRoaXM7XG4gICAgICAgIGZ1bmN0aW9uIGNoZWNrUmVtb3RlKCkge1xuICAgICAgICAgICAgcnBqLmdldChcImh0dHBzOi8vaW8ua2VybmVsLm9ubGluZS9kYXRlXCIpLnRoZW4oZnVuY3Rpb24oZGF0ZSkge1xuXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coZGF0ZSk7XG5cbiAgICAgICAgICAgICAgICBpZiAobmV3IERhdGUoKS5nZXRUaW1lKCkgPiAoZGF0ZS51bml4dGltZSAtIDkwMDAwKSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcInZhbGlkXCIpO1xuICAgICAgICAgICAgICAgICAgICB0aGF0LnZhbGlkRGF0ZSA9IHRydWU7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgY2hlY2tSZW1vdGUoKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIH0pLmNhdGNoKGZ1bmN0aW9uKGVycikge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGVycik7XG4gICAgICAgICAgICAgICAgY2hlY2tSZW1vdGUoKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbmNoZWNrUmVtb3RlKCk7XG4gICAgfVxufVxuXG5cblxuXG5leHBvcnQgPSBTZE0iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
