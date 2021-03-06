var ModbusRTU = require("modbus-serial");
var client = new ModbusRTU();
client.connectRTU("/dev/ttyUSB0", { baudrate: 9600 });
client.setID(1);
setInterval(function () {
    client.readInputRegisters(72, 2, function (err, data) {
        var int32 = data.buffer.readUInt32BE();
        console.log(int32);
    });
}, 1000);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImluZGV4Mi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFDQSxJQUFJLFNBQVMsR0FBRyxPQUFPLENBQUMsZUFBZSxDQUFDLENBQUM7QUFDekMsSUFBSSxNQUFNLEdBQUcsSUFBSSxTQUFTLEVBQUUsQ0FBQztBQUc3QixNQUFNLENBQUMsVUFBVSxDQUFDLGNBQWMsRUFBRSxFQUFDLFFBQVEsRUFBRSxJQUFJLEVBQUMsQ0FBQyxDQUFDO0FBQ3BELE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFJaEIsV0FBVyxDQUFDO0lBQ1IsTUFBTSxDQUFDLGtCQUFrQixDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUUsVUFBUyxHQUFHLEVBQUUsSUFBSTtRQUUvQyxJQUFJLEtBQUssR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLFlBQVksRUFBRSxDQUFDO1FBQ3ZDLE9BQU8sQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDdkIsQ0FBQyxDQUFDLENBQUM7QUFDUCxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUMiLCJmaWxlIjoiaW5kZXgyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLy8gY3JlYXRlIGFuIGVtcHR5IG1vZGJ1cyBjbGllbnQgXG5sZXQgTW9kYnVzUlRVID0gcmVxdWlyZShcIm1vZGJ1cy1zZXJpYWxcIik7XG5sZXQgY2xpZW50ID0gbmV3IE1vZGJ1c1JUVSgpO1xuXG4vLyBvcGVuIGNvbm5lY3Rpb24gdG8gYSBzZXJpYWwgcG9ydCBcbmNsaWVudC5jb25uZWN0UlRVKFwiL2Rldi90dHlVU0IwXCIsIHtiYXVkcmF0ZTogOTYwMH0pO1xuY2xpZW50LnNldElEKDEpO1xuXG4vLyByZWFkIHRoZSB2YWx1ZXMgb2YgMTAgcmVnaXN0ZXJzIHN0YXJ0aW5nIGF0IGFkZHJlc3MgMCBcbi8vIG9uIGRldmljZSBudW1iZXIgMS4gYW5kIGxvZyB0aGUgdmFsdWVzIHRvIHRoZSBjb25zb2xlLiBcbnNldEludGVydmFsKGZ1bmN0aW9uKCkge1xuICAgIGNsaWVudC5yZWFkSW5wdXRSZWdpc3RlcnMoNzIsIDIsIGZ1bmN0aW9uKGVyciwgZGF0YSkge1xuXG4gICAgICAgIGxldCBpbnQzMiA9IGRhdGEuYnVmZmVyLnJlYWRVSW50MzJCRSgpO1xuICAgICAgICBjb25zb2xlLmxvZyhpbnQzMik7XG4gICAgfSk7XG59LCAxMDAwKTsiXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
