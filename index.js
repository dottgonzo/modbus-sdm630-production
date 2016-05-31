"use strict";
var ModbusRTU = require("modbus-serial");
var merge = require("json-add");
var Promise = require("bluebird");
var async = require("async");
var lsusbdev = require("lsusbdev");
var defaults = {
    baud: 9600,
    dev: "/dev/ttyUSB0",
    address: 1
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
        this.client = new ModbusRTU();
        var that = this;
        if (conf) {
            merge(defaults, require("./conf.json"));
            that.client.setID(defaults.address);
            if (defaults.hub) {
                lsusbdev().then(function (devis) {
                    for (var i = 0; i < devis.length; i++) {
                        if (devis[i].hub === defaults.hub) {
                            defaults.dev = devis[i].dev;
                        }
                    }
                    that.conf = defaults;
                }).catch(function () {
                    throw "NO USB FOR SDM";
                });
            }
        }
        else {
            that.client.setID(defaults.address);
            that.conf = defaults;
        }
    }
    SdM.prototype.data = function () {
        var regs = [
            {
                label: "volt",
                phase: 1,
                reg: 0
            },
            {
                label: "volt",
                phase: 2,
                reg: 2
            },
            {
                label: "volt",
                phase: 3,
                reg: 4
            },
            {
                label: "current",
                phase: 1,
                reg: 6
            },
            {
                label: "current",
                phase: 2,
                reg: 8
            },
            {
                label: "current",
                phase: 3,
                reg: 10
            },
            {
                label: "power",
                phase: 1,
                reg: 12
            },
            {
                label: "power",
                phase: 2,
                reg: 14
            },
            {
                label: "power",
                phase: 3,
                reg: 16
            },
            {
                label: "frequency",
                phase: 0,
                reg: 70
            },
            {
                label: "totalPower",
                phase: 0,
                reg: 52
            },
            {
                label: "allPower",
                phase: 0,
                reg: 74
            }
        ];
        var that = this;
        return new Promise(function (resolve, reject) {
            function start() {
                var answer = {};
                async.eachSeries(regs, function (iterator, cb) {
                    readReg(that.client, iterator.reg).then(function (d) {
                        answer[iterator.label + iterator.phase] = d;
                        cb();
                    }).catch(function (err) {
                        console.log(err);
                        cb();
                    });
                }, function (err) {
                    if (err) {
                        reject(err);
                    }
                    else {
                        that.client.close(function () {
                            resolve(answer);
                        });
                    }
                });
            }
            that.client.connectRTU(that.conf.dev, { baudrate: that.conf.baud }, start);
        });
    };
    return SdM;
}());
var regss = [
    {
        label: "volt",
        phase: 1,
        reg: 0
    },
    {
        label: "volt",
        phase: 2,
        reg: 2
    }
];
module.exports = SdM;

//# sourceMappingURL=data:application/json;base64,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QUFHLENBQUEiLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VzQ29udGVudCI6WyJsZXQgTW9kYnVzUlRVID0gcmVxdWlyZShcIm1vZGJ1cy1zZXJpYWxcIik7XG5pbXBvcnQgKiBhcyBwYXRoRXhpc3RzIGZyb20gXCJwYXRoLWV4aXN0c1wiO1xuaW1wb3J0IG1lcmdlID0gcmVxdWlyZShcImpzb24tYWRkXCIpO1xuaW1wb3J0ICogYXMgUHJvbWlzZSBmcm9tIFwiYmx1ZWJpcmRcIjtcbmltcG9ydCAqIGFzIGFzeW5jIGZyb20gXCJhc3luY1wiO1xuXG5pbXBvcnQgbHN1c2JkZXYgPSByZXF1aXJlKFwibHN1c2JkZXZcIik7XG5cblxuXG5pbnRlcmZhY2UgSWRlZmF1bHRzIHtcbiAgICBiYXVkPzogbnVtYmVyO1xuICAgIGRldj86IHN0cmluZztcbiAgICBhZGRyZXNzPzogbnVtYmVyO1xuICAgIGh1Yj86IHN0cmluZztcbn1cblxubGV0IGRlZmF1bHRzID0gPElkZWZhdWx0cz57XG4gICAgYmF1ZDogOTYwMCxcbiAgICBkZXY6IFwiL2Rldi90dHlVU0IwXCIsXG4gICAgYWRkcmVzczogMVxufTtcblxuXG5cblxuZnVuY3Rpb24gcmVhZFJlZyhjbGllbnQsIHJlZzogbnVtYmVyKSB7XG5cblxuICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgICAgY2xpZW50LnJlYWRJbnB1dFJlZ2lzdGVycyhyZWcsIDIpLnRoZW4oZnVuY3Rpb24oZGF0YSkge1xuXG5cbiAgICAgICAgICAgIHJlc29sdmUoZGF0YS5idWZmZXIucmVhZEZsb2F0QkUoKSk7XG4gICAgICAgIH0pLmNhdGNoKGZ1bmN0aW9uKGVycikge1xuICAgICAgICAgICAgcmVqZWN0KGVycik7XG4gICAgICAgIH0pO1xuICAgIH0pO1xuXG59XG5cblxuXG5jbGFzcyBTZE0ge1xuICAgIGNsaWVudDtcbiAgICBjb25mOiBJZGVmYXVsdHM7XG4gICAgY29uc3RydWN0b3IoY29uZj86IElkZWZhdWx0cykge1xuXG4gICAgICAgIHRoaXMuY2xpZW50ID0gbmV3IE1vZGJ1c1JUVSgpO1xuICAgICAgICBsZXQgdGhhdCA9IHRoaXM7XG4gICAgICAgIGlmIChjb25mKSB7XG5cbiAgICAgICAgICAgIG1lcmdlKGRlZmF1bHRzLCByZXF1aXJlKFwiLi9jb25mLmpzb25cIikpO1xuXG4gICAgICAgICAgICB0aGF0LmNsaWVudC5zZXRJRChkZWZhdWx0cy5hZGRyZXNzKTtcblxuXG4gICAgICAgICAgICBpZiAoZGVmYXVsdHMuaHViKSB7XG4gICAgICAgICAgICAgICAgbHN1c2JkZXYoKS50aGVuKGZ1bmN0aW9uKGRldmlzKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBkZXZpcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGRldmlzW2ldLmh1YiA9PT0gZGVmYXVsdHMuaHViKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVmYXVsdHMuZGV2ID0gZGV2aXNbaV0uZGV2O1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHRoYXQuY29uZiA9IGRlZmF1bHRzO1xuICAgICAgICAgICAgICAgIH0pLmNhdGNoKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBcIk5PIFVTQiBGT1IgU0RNXCI7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoYXQuY2xpZW50LnNldElEKGRlZmF1bHRzLmFkZHJlc3MpO1xuICAgICAgICAgICAgdGhhdC5jb25mID0gZGVmYXVsdHM7XG5cblxuICAgICAgICB9XG4gICAgfVxuICAgIGRhdGEoKSB7XG5cbiAgICAgICAgbGV0IHJlZ3MgPSBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbGFiZWw6IFwidm9sdFwiLFxuICAgICAgICAgICAgICAgIHBoYXNlOiAxLFxuICAgICAgICAgICAgICAgIHJlZzogMFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBsYWJlbDogXCJ2b2x0XCIsXG4gICAgICAgICAgICAgICAgcGhhc2U6IDIsXG4gICAgICAgICAgICAgICAgcmVnOiAyXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGxhYmVsOiBcInZvbHRcIixcbiAgICAgICAgICAgICAgICBwaGFzZTogMyxcbiAgICAgICAgICAgICAgICByZWc6IDRcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbGFiZWw6IFwiY3VycmVudFwiLFxuICAgICAgICAgICAgICAgIHBoYXNlOiAxLFxuICAgICAgICAgICAgICAgIHJlZzogNlxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBsYWJlbDogXCJjdXJyZW50XCIsXG4gICAgICAgICAgICAgICAgcGhhc2U6IDIsXG4gICAgICAgICAgICAgICAgcmVnOiA4XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGxhYmVsOiBcImN1cnJlbnRcIixcbiAgICAgICAgICAgICAgICBwaGFzZTogMyxcbiAgICAgICAgICAgICAgICByZWc6IDEwXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGxhYmVsOiBcInBvd2VyXCIsXG4gICAgICAgICAgICAgICAgcGhhc2U6IDEsXG4gICAgICAgICAgICAgICAgcmVnOiAxMlxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBsYWJlbDogXCJwb3dlclwiLFxuICAgICAgICAgICAgICAgIHBoYXNlOiAyLFxuICAgICAgICAgICAgICAgIHJlZzogMTRcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbGFiZWw6IFwicG93ZXJcIixcbiAgICAgICAgICAgICAgICBwaGFzZTogMyxcbiAgICAgICAgICAgICAgICByZWc6IDE2XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGxhYmVsOiBcImZyZXF1ZW5jeVwiLFxuICAgICAgICAgICAgICAgIHBoYXNlOiAwLFxuICAgICAgICAgICAgICAgIHJlZzogNzBcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbGFiZWw6IFwidG90YWxQb3dlclwiLFxuICAgICAgICAgICAgICAgIHBoYXNlOiAwLFxuICAgICAgICAgICAgICAgIHJlZzogNTJcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbGFiZWw6IFwiYWxsUG93ZXJcIixcbiAgICAgICAgICAgICAgICBwaGFzZTogMCxcbiAgICAgICAgICAgICAgICByZWc6IDc0XG4gICAgICAgICAgICB9XG4gICAgICAgIF07XG5cblxuXG5cbiAgICAgICAgbGV0IHRoYXQgPSB0aGlzO1xuXG5cblxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7XG5cblxuICAgICAgICAgICAgZnVuY3Rpb24gc3RhcnQoKSB7XG5cblxuXG5cbiAgICAgICAgICAgICAgICBsZXQgYW5zd2VyID0ge307XG5cbiAgICAgICAgICAgICAgICBhc3luYy5lYWNoU2VyaWVzKHJlZ3MsIGZ1bmN0aW9uKGl0ZXJhdG9yLCBjYikge1xuXG4gICAgICAgICAgICAgICAgICAgIHJlYWRSZWcodGhhdC5jbGllbnQsIGl0ZXJhdG9yLnJlZykudGhlbihmdW5jdGlvbihkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhbnN3ZXJbaXRlcmF0b3IubGFiZWwgKyBpdGVyYXRvci5waGFzZV0gPSBkO1xuICAgICAgICAgICAgICAgICAgICAgICAgY2IoKTtcbiAgICAgICAgICAgICAgICAgICAgfSkuY2F0Y2goZnVuY3Rpb24oZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhlcnIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgY2IoKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICB9LCBmdW5jdGlvbihlcnIpIHtcblxuICAgICAgICAgICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZWplY3QoZXJyKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoYXQuY2xpZW50LmNsb3NlKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoYW5zd2VyKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICB9XG5cblxuICAgICAgICAgICAgdGhhdC5jbGllbnQuY29ubmVjdFJUVSh0aGF0LmNvbmYuZGV2LCB7IGJhdWRyYXRlOiB0aGF0LmNvbmYuYmF1ZCB9LCBzdGFydCk7XG4gICAgICAgIH0pO1xuXG4gICAgfVxufVxuXG5cblxuXG5cblxuXG5sZXQgcmVnc3MgPSBbXG4gICAge1xuICAgICAgICBsYWJlbDogXCJ2b2x0XCIsXG4gICAgICAgIHBoYXNlOiAxLFxuICAgICAgICByZWc6IDBcbiAgICB9LFxuICAgIHtcbiAgICAgICAgbGFiZWw6IFwidm9sdFwiLFxuICAgICAgICBwaGFzZTogMixcbiAgICAgICAgcmVnOiAyXG4gICAgfVxuXTtcblxuXG5cblxuZXhwb3J0ID0gU2RNIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
