"use strict";
var ModbusRTU = require("modbus-serial");
var merge = require("json-add");
var Promise = require("bluebird");
var async = require("async");
var lsusbdev = require("lsusbdev");
var defaults = {
    baud: 9600,
    dev: "/dev/ttyUSB0",
    address: 1,
    type: "import"
};
function readReg(client, reg) {
    console.log("reg");
    return new Promise(function (resolve, reject) {
        client.readInputRegisters(reg, 2).then(function (data) {
            resolve(data.buffer.readFloatBE());
        }).catch(function (err) {
            reject(err);
        });
    });
}
function start(config, client) {
    console.log(config);
    return new Promise(function (resolve, reject) {
        var answer = {
            grid: {},
            strings: []
        };
        async.eachSeries(config.regs, function (iterator, cb) {
            readReg(client, iterator.reg).then(function (d) {
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
                reject(err);
            }
            else if (answer.grid.power && answer.grid.power > 0) {
                console.log(answer);
                resolve(answer);
            }
        });
    });
}
var SdM = (function () {
    function SdM(conf) {
        this.client = new ModbusRTU();
        var that = this;
        that.conf = [];
        if (conf) {
            for (var i = 0; i < conf.length; i++) {
                merge(defaults, conf[i]);
                if (defaults.hub) {
                    lsusbdev().then(function (devis) {
                        for (var i_1 = 0; i_1 < devis.length; i_1++) {
                            if (devis[i_1].hub === defaults.hub) {
                                defaults.dev = devis[i_1].dev;
                            }
                        }
                        that.conf.push(defaults);
                    }).catch(function () {
                        throw "NO USB FOR SDM";
                    });
                }
            }
        }
        else {
            that.conf.push(defaults);
        }
    }
    SdM.prototype.last = function () {
        return this.latest;
    };
    SdM.prototype.data = function (call, interval) {
        var that = this;
        var configs = [];
        var answers = [];
        for (var i = 0; i < this.conf.length; i++) {
            var regs = void 0;
            if (this.conf[i].type === "import") {
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
            else if (this.conf[i].type === "export") {
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
            configs.push({ regs: regs, settings: that.conf[i] });
            answers.push({
                apiVersion: require("./package.json").version,
                address: that.conf[i].address,
                model: "sdm630",
                active: true,
                uid: that.conf[i].uid
            });
        }
        function todo() {
            async.eachSeries(configs, function (iterator, cb) {
                that.client.setID(iterator.settings.address);
                that.client.connectRTU(iterator.settings.dev, { baudrate: iterator.settings.baud }, start(iterator, that.client).then(function (data) {
                    answers.push(data);
                    cb();
                }).catch(function (err) {
                    cb(err);
                }));
            }, function (err) {
                if (err) {
                    console.log(err);
                }
                else {
                    call(answers);
                }
            });
        }
        if (interval) {
            setInterval(function () {
                todo();
            }, interval);
        }
        else {
            todo();
        }
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

//# sourceMappingURL=data:application/json;base64,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cmVxdWlyZShcIm1vZGJ1cy1zZXJpYWxcIik7XG5pbXBvcnQgbWVyZ2UgPSByZXF1aXJlKFwianNvbi1hZGRcIik7XG5pbXBvcnQgKiBhcyBQcm9taXNlIGZyb20gXCJibHVlYmlyZFwiO1xuaW1wb3J0ICogYXMgYXN5bmMgZnJvbSBcImFzeW5jXCI7XG5cbmltcG9ydCBsc3VzYmRldiA9IHJlcXVpcmUoXCJsc3VzYmRldlwiKTtcblxuXG5cbmludGVyZmFjZSBJZGVmYXVsdHMge1xuICAgIGJhdWQ/OiBudW1iZXI7XG4gICAgZGV2Pzogc3RyaW5nO1xuICAgIGFkZHJlc3M/OiBudW1iZXI7XG4gICAgaHViPzogc3RyaW5nO1xuICAgIHR5cGU/OiBzdHJpbmc7XG4gICAgdWlkPzogc3RyaW5nO1xufVxuXG5sZXQgZGVmYXVsdHMgPSA8SWRlZmF1bHRzPntcbiAgICBiYXVkOiA5NjAwLFxuICAgIGRldjogXCIvZGV2L3R0eVVTQjBcIixcbiAgICBhZGRyZXNzOiAxLFxuICAgIHR5cGU6IFwiaW1wb3J0XCJcbn07XG5cbmludGVyZmFjZSBJcmVnIHtcbiAgICBsYWJlbDogc3RyaW5nO1xuICAgIHBoYXNlOiBudW1iZXI7XG4gICAgcmVnOiBudW1iZXI7XG4gICAgZ3JvdXA6IHN0cmluZztcbn1cblxuXG5mdW5jdGlvbiByZWFkUmVnKGNsaWVudCwgcmVnOiBudW1iZXIpIHtcblxuY29uc29sZS5sb2coXCJyZWdcIik7XG5cbiAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgIGNsaWVudC5yZWFkSW5wdXRSZWdpc3RlcnMocmVnLCAyKS50aGVuKGZ1bmN0aW9uKGRhdGEpIHtcblxuXG4gICAgICAgICAgICByZXNvbHZlKGRhdGEuYnVmZmVyLnJlYWRGbG9hdEJFKCkpO1xuICAgICAgICB9KS5jYXRjaChmdW5jdGlvbihlcnIpIHtcbiAgICAgICAgICAgIHJlamVjdChlcnIpO1xuICAgICAgICB9KTtcbiAgICB9KTtcblxufVxuXG5cblxuZnVuY3Rpb24gc3RhcnQoY29uZmlnLCBjbGllbnQpIHtcbmNvbnNvbGUubG9nKGNvbmZpZylcbiAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgIGxldCBhbnN3ZXIgPSA8YW55PntcbiAgICAgICAgICAgIGdyaWQ6IHt9LFxuICAgICAgICAgICAgc3RyaW5nczogW11cbiAgICAgICAgfTtcbiAgICAgICAgYXN5bmMuZWFjaFNlcmllcyhjb25maWcucmVncywgZnVuY3Rpb24oaXRlcmF0b3I6IGFueSwgY2IpIHtcblxuICAgICAgICAgICAgcmVhZFJlZyhjbGllbnQsIGl0ZXJhdG9yLnJlZykudGhlbihmdW5jdGlvbihkKSB7XG5cbiAgICAgICAgICAgICAgICBpZiAoaXRlcmF0b3IuZ3JvdXAgPT09IFwic3RyaW5nc1wiKSB7XG5cblxuICAgICAgICAgICAgICAgICAgICBpZiAoIWFuc3dlci5zdHJpbmdzW2l0ZXJhdG9yLnBoYXNlIC0gMV0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFuc3dlci5zdHJpbmdzW2l0ZXJhdG9yLnBoYXNlIC0gMV0gPSB7fTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBhbnN3ZXIuc3RyaW5nc1tpdGVyYXRvci5waGFzZSAtIDFdW2l0ZXJhdG9yLmxhYmVsXSA9IGQ7XG5cbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGl0ZXJhdG9yLmdyb3VwID09PSBcImdyaWRcIikge1xuXG4gICAgICAgICAgICAgICAgICAgIGFuc3dlci5ncmlkW2l0ZXJhdG9yLmxhYmVsXSA9IGQ7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChpdGVyYXRvci5ncm91cCA9PT0gXCJtYWluXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgYW5zd2VyW2l0ZXJhdG9yLmxhYmVsXSA9IGQ7XG5cbiAgICAgICAgICAgICAgICB9XG5cblxuXG4gICAgICAgICAgICAgICAgY2IoKTtcbiAgICAgICAgICAgIH0pLmNhdGNoKGZ1bmN0aW9uKGVycikge1xuICAgICAgICAgICAgICAgIGNiKGVycik7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICB9LCBmdW5jdGlvbihlcnIpIHtcblxuICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgIHJlamVjdChlcnIpO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChhbnN3ZXIuZ3JpZC5wb3dlciAmJiBhbnN3ZXIuZ3JpZC5wb3dlciA+IDApIHtcbmNvbnNvbGUubG9nKGFuc3dlcilcbiAgICAgICAgICAgICAgICByZXNvbHZlKGFuc3dlcik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgfSk7XG4gICAgfSk7XG5cbn1cblxuXG5jbGFzcyBTZE0ge1xuICAgIGNsaWVudDtcbiAgICBsYXRlc3Q7XG4gICAgY29uZjogSWRlZmF1bHRzW107XG4gICAgY29uc3RydWN0b3IoY29uZj86IElkZWZhdWx0c1tdKSB7XG5cbiAgICAgICAgdGhpcy5jbGllbnQgPSBuZXcgTW9kYnVzUlRVKCk7XG4gICAgICAgIGxldCB0aGF0ID0gdGhpcztcbiAgICAgICAgdGhhdC5jb25mID0gW107XG5cbiAgICAgICAgaWYgKGNvbmYpIHtcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY29uZi5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIG1lcmdlKGRlZmF1bHRzLCBjb25mW2ldKTtcbiAgICAgICAgICAgICAgICBpZiAoZGVmYXVsdHMuaHViKSB7XG4gICAgICAgICAgICAgICAgICAgIGxzdXNiZGV2KCkudGhlbihmdW5jdGlvbihkZXZpcykge1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGRldmlzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGRldmlzW2ldLmh1YiA9PT0gZGVmYXVsdHMuaHViKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlZmF1bHRzLmRldiA9IGRldmlzW2ldLmRldjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGF0LmNvbmYucHVzaChkZWZhdWx0cyk7XG4gICAgICAgICAgICAgICAgICAgIH0pLmNhdGNoKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgXCJOTyBVU0IgRk9SIFNETVwiO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoYXQuY29uZi5wdXNoKGRlZmF1bHRzKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGxhc3QoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmxhdGVzdDtcbiAgICB9XG5cbiAgICBkYXRhKGNhbGw/OiBGdW5jdGlvbiwgaW50ZXJ2YWw/OiBudW1iZXIpIHtcblxuXG4gICAgICAgIGxldCB0aGF0ID0gdGhpcztcblxuICAgICAgICBsZXQgY29uZmlncyA9IFtdO1xuICAgICAgICBsZXQgYW5zd2VycyA9IFtdO1xuXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5jb25mLmxlbmd0aDsgaSsrKSB7XG5cbiAgICAgICAgICAgIGxldCByZWdzOiBJcmVnW107XG5cbiAgICAgICAgICAgIGlmICh0aGlzLmNvbmZbaV0udHlwZSA9PT0gXCJpbXBvcnRcIikge1xuICAgICAgICAgICAgICAgIHJlZ3MgPSBbXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxhYmVsOiBcInZvbHRhZ2VcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIHBoYXNlOiAxLFxuICAgICAgICAgICAgICAgICAgICAgICAgcmVnOiAwLFxuICAgICAgICAgICAgICAgICAgICAgICAgZ3JvdXA6IFwic3RyaW5nc1wiXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxhYmVsOiBcInZvbHRhZ2VcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIHBoYXNlOiAyLFxuICAgICAgICAgICAgICAgICAgICAgICAgcmVnOiAyLFxuICAgICAgICAgICAgICAgICAgICAgICAgZ3JvdXA6IFwic3RyaW5nc1wiXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxhYmVsOiBcInZvbHRhZ2VcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIHBoYXNlOiAzLFxuICAgICAgICAgICAgICAgICAgICAgICAgcmVnOiA0LFxuICAgICAgICAgICAgICAgICAgICAgICAgZ3JvdXA6IFwic3RyaW5nc1wiXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxhYmVsOiBcImN1cnJlbnRcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIHBoYXNlOiAxLFxuICAgICAgICAgICAgICAgICAgICAgICAgcmVnOiA2LFxuICAgICAgICAgICAgICAgICAgICAgICAgZ3JvdXA6IFwic3RyaW5nc1wiXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxhYmVsOiBcImN1cnJlbnRcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIHBoYXNlOiAyLFxuICAgICAgICAgICAgICAgICAgICAgICAgcmVnOiA4LFxuICAgICAgICAgICAgICAgICAgICAgICAgZ3JvdXA6IFwic3RyaW5nc1wiXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxhYmVsOiBcImN1cnJlbnRcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIHBoYXNlOiAzLFxuICAgICAgICAgICAgICAgICAgICAgICAgcmVnOiAxMCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGdyb3VwOiBcInN0cmluZ3NcIlxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICBsYWJlbDogXCJwb3dlclwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgcGhhc2U6IDEsXG4gICAgICAgICAgICAgICAgICAgICAgICByZWc6IDEyLFxuICAgICAgICAgICAgICAgICAgICAgICAgZ3JvdXA6IFwic3RyaW5nc1wiXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxhYmVsOiBcInBvd2VyXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBwaGFzZTogMixcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlZzogMTQsXG4gICAgICAgICAgICAgICAgICAgICAgICBncm91cDogXCJzdHJpbmdzXCJcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgbGFiZWw6IFwicG93ZXJcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIHBoYXNlOiAzLFxuICAgICAgICAgICAgICAgICAgICAgICAgcmVnOiAxNixcbiAgICAgICAgICAgICAgICAgICAgICAgIGdyb3VwOiBcInN0cmluZ3NcIlxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICBsYWJlbDogXCJoelwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgcGhhc2U6IDAsXG4gICAgICAgICAgICAgICAgICAgICAgICByZWc6IDcwLFxuICAgICAgICAgICAgICAgICAgICAgICAgZ3JvdXA6IFwiZ3JpZFwiXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxhYmVsOiBcInBvd2VyXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBwaGFzZTogMCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlZzogNTIsXG4gICAgICAgICAgICAgICAgICAgICAgICBncm91cDogXCJncmlkXCJcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgbGFiZWw6IFwidm9sdGFnZVwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgcGhhc2U6IDAsXG4gICAgICAgICAgICAgICAgICAgICAgICByZWc6IDQyLFxuICAgICAgICAgICAgICAgICAgICAgICAgZ3JvdXA6IFwiZ3JpZFwiXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxhYmVsOiBcImN1cnJlbnRcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIHBoYXNlOiAwLFxuICAgICAgICAgICAgICAgICAgICAgICAgcmVnOiA0NixcbiAgICAgICAgICAgICAgICAgICAgICAgIGdyb3VwOiBcImdyaWRcIlxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICBsYWJlbDogXCJwZWFrTWF4XCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBwaGFzZTogMCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlZzogODYsXG4gICAgICAgICAgICAgICAgICAgICAgICBncm91cDogXCJtYWluXCJcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgbGFiZWw6IFwidG90YWxFbmVyZ3lcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIHBoYXNlOiAwLFxuICAgICAgICAgICAgICAgICAgICAgICAgcmVnOiA3MixcbiAgICAgICAgICAgICAgICAgICAgICAgIGdyb3VwOiBcIm1haW5cIlxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgXTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAodGhpcy5jb25mW2ldLnR5cGUgPT09IFwiZXhwb3J0XCIpIHtcbiAgICAgICAgICAgICAgICByZWdzID0gW1xuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICBsYWJlbDogXCJ2b2x0YWdlXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBwaGFzZTogMSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlZzogMCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGdyb3VwOiBcInN0cmluZ3NcIlxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICBsYWJlbDogXCJ2b2x0YWdlXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBwaGFzZTogMixcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlZzogMixcbiAgICAgICAgICAgICAgICAgICAgICAgIGdyb3VwOiBcInN0cmluZ3NcIlxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICBsYWJlbDogXCJ2b2x0YWdlXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBwaGFzZTogMyxcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlZzogNCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGdyb3VwOiBcInN0cmluZ3NcIlxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICBsYWJlbDogXCJjdXJyZW50XCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBwaGFzZTogMSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlZzogNixcbiAgICAgICAgICAgICAgICAgICAgICAgIGdyb3VwOiBcInN0cmluZ3NcIlxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICBsYWJlbDogXCJjdXJyZW50XCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBwaGFzZTogMixcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlZzogOCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGdyb3VwOiBcInN0cmluZ3NcIlxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICBsYWJlbDogXCJjdXJyZW50XCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBwaGFzZTogMyxcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlZzogMTAsXG4gICAgICAgICAgICAgICAgICAgICAgICBncm91cDogXCJzdHJpbmdzXCJcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgbGFiZWw6IFwicG93ZXJcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIHBoYXNlOiAxLFxuICAgICAgICAgICAgICAgICAgICAgICAgcmVnOiAxMixcbiAgICAgICAgICAgICAgICAgICAgICAgIGdyb3VwOiBcInN0cmluZ3NcIlxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICBsYWJlbDogXCJwb3dlclwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgcGhhc2U6IDIsXG4gICAgICAgICAgICAgICAgICAgICAgICByZWc6IDE0LFxuICAgICAgICAgICAgICAgICAgICAgICAgZ3JvdXA6IFwic3RyaW5nc1wiXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxhYmVsOiBcInBvd2VyXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBwaGFzZTogMyxcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlZzogMTYsXG4gICAgICAgICAgICAgICAgICAgICAgICBncm91cDogXCJzdHJpbmdzXCJcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgbGFiZWw6IFwiaHpcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIHBoYXNlOiAwLFxuICAgICAgICAgICAgICAgICAgICAgICAgcmVnOiA3MCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGdyb3VwOiBcImdyaWRcIlxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICBsYWJlbDogXCJwb3dlclwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgcGhhc2U6IDAsXG4gICAgICAgICAgICAgICAgICAgICAgICByZWc6IDUyLFxuICAgICAgICAgICAgICAgICAgICAgICAgZ3JvdXA6IFwiZ3JpZFwiXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxhYmVsOiBcInZvbHRhZ2VcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIHBoYXNlOiAwLFxuICAgICAgICAgICAgICAgICAgICAgICAgcmVnOiA0MixcbiAgICAgICAgICAgICAgICAgICAgICAgIGdyb3VwOiBcImdyaWRcIlxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICBsYWJlbDogXCJjdXJyZW50XCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBwaGFzZTogMCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlZzogNDYsXG4gICAgICAgICAgICAgICAgICAgICAgICBncm91cDogXCJncmlkXCJcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgbGFiZWw6IFwicGVha01heFwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgcGhhc2U6IDAsXG4gICAgICAgICAgICAgICAgICAgICAgICByZWc6IDg2LFxuICAgICAgICAgICAgICAgICAgICAgICAgZ3JvdXA6IFwibWFpblwiXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxhYmVsOiBcInRvdGFsRW5lcmd5XCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBwaGFzZTogMCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlZzogNzQsXG4gICAgICAgICAgICAgICAgICAgICAgICBncm91cDogXCJtYWluXCJcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIF07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbmZpZ3MucHVzaCh7IHJlZ3M6IHJlZ3MsIHNldHRpbmdzOiB0aGF0LmNvbmZbaV0gfSk7XG4gICAgICAgICAgICBhbnN3ZXJzLnB1c2goe1xuICAgICAgICAgICAgICAgIGFwaVZlcnNpb246IHJlcXVpcmUoXCIuL3BhY2thZ2UuanNvblwiKS52ZXJzaW9uLFxuICAgICAgICAgICAgICAgIGFkZHJlc3M6IHRoYXQuY29uZltpXS5hZGRyZXNzLFxuICAgICAgICAgICAgICAgIG1vZGVsOiBcInNkbTYzMFwiLFxuICAgICAgICAgICAgICAgIGFjdGl2ZTogdHJ1ZSxcbiAgICAgICAgICAgICAgICB1aWQ6IHRoYXQuY29uZltpXS51aWRcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gdG9kbygpIHtcblxuXG4gICAgICAgICAgICBhc3luYy5lYWNoU2VyaWVzKGNvbmZpZ3MsIGZ1bmN0aW9uKGl0ZXJhdG9yLCBjYikge1xuXG4gICAgICAgICAgICAgICAgdGhhdC5jbGllbnQuc2V0SUQoaXRlcmF0b3Iuc2V0dGluZ3MuYWRkcmVzcyk7XG4gICAgICAgICAgICAgICAgdGhhdC5jbGllbnQuY29ubmVjdFJUVShpdGVyYXRvci5zZXR0aW5ncy5kZXYsIHsgYmF1ZHJhdGU6IGl0ZXJhdG9yLnNldHRpbmdzLmJhdWQgfSwgc3RhcnQoaXRlcmF0b3IsIHRoYXQuY2xpZW50KS50aGVuKGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICAgICAgICAgICAgYW5zd2Vycy5wdXNoKGRhdGEpO1xuICAgICAgICAgICAgICAgICAgICBjYigpO1xuICAgICAgICAgICAgICAgIH0pLmNhdGNoKGZ1bmN0aW9uKGVycikge1xuICAgICAgICAgICAgICAgICAgICBjYihlcnIpO1xuICAgICAgICAgICAgICAgIH0pKTtcblxuXG4gICAgICAgICAgICB9LCBmdW5jdGlvbihlcnIpIHtcblxuICAgICAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coZXJyKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBjYWxsKGFuc3dlcnMpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgIH1cblxuICAgICAgICBpZiAoaW50ZXJ2YWwpIHtcbiAgICAgICAgICAgIHNldEludGVydmFsKGZ1bmN0aW9uKCkge1xuXG4gICAgICAgICAgICAgICAgdG9kbygpO1xuICAgICAgICAgICAgfSwgaW50ZXJ2YWwpO1xuICAgICAgICB9IGVsc2Uge1xuXG4gICAgICAgICAgICB0b2RvKCk7XG5cbiAgICAgICAgfVxuXG4gICAgfVxufVxuXG5cblxuXG5cblxuXG5sZXQgcmVnc3MgPSBbXG4gICAge1xuICAgICAgICBsYWJlbDogXCJ2b2x0XCIsXG4gICAgICAgIHBoYXNlOiAxLFxuICAgICAgICByZWc6IDBcbiAgICB9LFxuICAgIHtcbiAgICAgICAgbGFiZWw6IFwidm9sdFwiLFxuICAgICAgICBwaGFzZTogMixcbiAgICAgICAgcmVnOiAyXG4gICAgfVxuXTtcblxuXG5cblxuZXhwb3J0ID0gU2RNIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9