/*
	Socket to be intialized on opening the settings page in Admin console
*/
/* global $ AdminSocketBase */
/* eslint no-unused-vars:0 */
var AdminSocketSettings = AdminSocketBase.extend({
	constructor: function(host) {
		this.base(host);
		this._init();
	},

	_init: function() {
		var socketSettings = this.socket;
		$(document).ready(function() {
			$('#admin_settings').on('submit', function(e) {
				e.preventDefault();
				var memStatsSize = $('#mem_stats_size').val();
				var memStatsInterval = $('#mem_stats_interval').val();
				var cpuStatsSize = $('#cpu_stats_size').val();
				var cpuStatsInterval = $('#cpu_stats_interval').val();
				var command = 'set';
				command += ' mem_stats_size=' + memStatsSize;
				command += ' mem_stats_interval=' + memStatsInterval;
				command += ' cpu_stats_size=' + cpuStatsSize;
				command += ' cpu_stats_interval=' + cpuStatsInterval;
				socketSettings.send(command);
			});

			$('#btnShutdown').click(function() {
				vex.dialog.confirm({
					message: _('Are you sure you want to shut down the server?'),
					callback: function(value) {
						// TODO: Prompt for reason.
						if (value) {
							socketSettings.send('shutdown maintenance');
						}
					}
				});
			});
			// 預設的 tab 頁
			if (Util.getCookie('deftab') != '') {
				var tabid = Util.getCookie('deftab').split('=')[1];
				if (tabid == '') {
					$('.nav-tabs a[href="#a1"]').tab('show');
				}
				else {
					$('.nav-tabs a[href="'+tabid+'"]').tab('show');
				}
			}
			else {
				$('.nav-tabs a[href="#a1"]').tab('show');
			}
		});
	},

	onSocketOpen: function() {
		// Base class' onSocketOpen handles authentication
		this.base.call(this);
		this.socket.send('subscribe settings macaddr ipaddr');
		this.socket.send('settings');
		this.socket.send('macaddr');
		this.socket.send('ipaddr');
		this.socket.send('version');
	},

	onSocketMessage: function(e) {
		var textMsg;
		if (typeof e.data === 'string') {
			textMsg = e.data;
		}
		else {
			textMsg = '';
		}

		if (textMsg.startsWith('settings')) {
			textMsg = textMsg.substring('settings '.length);
			var settings = textMsg.split(' ');
			for (var i = 0; i < settings.length; i++) {
				var setting = settings[i].split('=');
				var settingKey = setting[0];
				var settingVal = setting[1];
				document.getElementById(settingKey).value = settingVal;
			}
		}
		else if (textMsg.startsWith('macaddr') ||
				 textMsg.startsWith('ipaddr')) {
			/// Mac/IP address list
			var forMac = false;
			var forIP = false;
			if (textMsg.startsWith('macaddr')) {
				forMac = true;
				textMsg = textMsg.substring('macaddr '.length);
				formid = '#macForm';
				type = 'mac';
			}
			if (textMsg.startsWith('ipaddr')) {
				forIP = true;
				textMsg = textMsg.substring('ipaddr '.length);
				formid = '#ipForm';
				type = 'ip';
			}
			jsonStart = textMsg.indexOf('{');
			jsonMsg = JSON.parse(textMsg.substr(jsonStart).trim());
			macList = jsonMsg;

			makeMacIpColumns(formid, macList, type);

			var socketSettings = this.socket;

			/// 列完後直接新增 del, modify, add event
			// modify
			$('button[name=mod_macip][ctype='+type+']').on('click', function(e) {
				e.preventDefault();
				var recid = this.form.elements['rec_id'].value;
				var macip = this.form.elements['macip'].value;
				var desc = this.form.elements['desc'].value;
				if (macip === '') {
					alert('請輸入 Mac/IP address');
					return;
				}

				var command = 'macdata';
				command += ' ' + recid;
				command += ',' + desc;
				command += ',' + macip;
				socketSettings.send(command);
				//this.form.submit();
			});
			// del
			$('button[name=del_macip][ctype='+type+']').on('click', function(e) {
				e.preventDefault();
				if (!confirm('確認刪除？')) {
					return;
				}
				var recid = this.form.elements['rec_id'].value;

				var command = 'rmmacdata';
				command += ' ' + recid;
				socketSettings.send(command);
				this.form.submit();
			});
			// add
			$('#macForm[ctype='+type+'], #ipForm[ctype='+type+']').on('submit', function(e) {
				e.preventDefault();
				var macip = this.elements['macip'].value.trim();
				var desc = this.elements['desc'].value.trim();
				if (macip === '') {
					alert('請輸入 Mac/IP address');
					return;
				}

				var command;
				if (forMac) {
					command = 'addmacdata';
				}
				if (forIP) {
					command = 'addipdata';
				}
				command += ' ' + macip;
				command += ',' + desc;
				socketSettings.send(command);
				//this.submit();
			});
		}
		else if (textMsg.startsWith('loolserver ')) {
			// This must be the first message, unless we reconnect.
			var loolwsdVersionObj = JSON.parse(textMsg.substring(textMsg.indexOf('{')));
			var h = loolwsdVersionObj.Hash;
			if (parseInt(h,16).toString(16) === h.toLowerCase().replace(/^0+/, '')) {
				h = '<a target="_blank" href="https://hub.libreoffice.org/git-online/' + h + '">' + h + '</a>';
				$('#loolwsd-version').html(loolwsdVersionObj.Version + ' (git hash: ' + h + ')');
			}
			else {
				$('#loolwsd-version').text(loolwsdVersionObj.Version);
			}
		}
		else if (textMsg.startsWith('macdata_done ')) {
			/// 更新 mac/ip address: server 傳回
			var success = JSON.parse(textMsg.substring(textMsg.indexOf(' ') + 1));
			if (success) {
				alert('修改成功');
				//location.reload();
			}
			else {
				alert('修改失敗');
			}
		}
		else if (textMsg.startsWith('addmacdata_done ')) {
			/// 新增 mac/ip address: server 傳回
			var success = JSON.parse(textMsg.substring(textMsg.indexOf(' ') + 1));
			if (success) {
				alert('新增成功');
				location.reload();
			}
			else {
				alert('新增失敗');
			}
		}
		else if (textMsg.startsWith('lokitversion ')) {
			var lokitVersionObj = JSON.parse(textMsg.substring(textMsg.indexOf('{')));
			var h = lokitVersionObj.BuildId.substring(0, 7);
			if (parseInt(h,16).toString(16) === h.toLowerCase().replace(/^0+/, '')) {
				h = '<a target="_blank" href="https://hub.libreoffice.org/git-core/' + h + '">' + h + '</a>';
			}
			$('#lokit-version').html(lokitVersionObj.ProductName + ' ' +
			                         lokitVersionObj.ProductVersion + lokitVersionObj.ProductExtension.replace('.10.','-') +
			                         ' (git hash: ' + h + ')');
		}
	},

	onSocketClose: function() {
		clearInterval(this._basicStatsIntervalId);
	}
});

Admin.Settings = function(host) {
	return new AdminSocketSettings(host);
};
