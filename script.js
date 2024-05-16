var YandexMessenger = {
    token: null,
    to: null,
    message: null,
    proxy: null,
    parse_mode: null,

    escapeMarkup: function (str, mode) {
        switch (mode) {
            case 'markdown':
                return str.replace(/([_*\[`])/g, '\\$&');

            case 'markdownv2':
                return str.replace(/([_*\[\]()~`>#+\-=|{}.!])/g, '\\$&');

            case 'html':
                return str.replace(/<(\s|[^a-z\/])/g, '&lt;$1');

            default:
                return str;
        }
    },

    sendMessage: function () {
        var params = {chat_id: YandexMessenger.to, text: YandexMessenger.message};
        var request = new HttpRequest();
        var url = 'https://botapi.messenger.yandex.net/bot/v1/messages/sendText/';

        request.addHeader('Content-Type: application/json');
        var q= 'Authorization: OAuth ' + YandexMessenger.token;
        Zabbix.log(4, q);
        request.addHeader(q);
        var data = JSON.stringify(params);

        // Remove replace() function if you want to see the exposed token in the log file.
        Zabbix.log(4, '[YandexMessenger Webhook] URL: ' + url.replace(YandexMessenger.token, '<TOKEN>'));
        Zabbix.log(4, '[YandexMessenger Webhook] params: ' + data);
        var response = request.post(url, data);
        Zabbix.log(4, '[YandexMessenger Webhook] HTTP code: ' + request.getStatus());

        try {
            response = JSON.parse(response);
        } catch (error) {
            response = null;
        }

        if (request.getStatus() !== 200 || typeof response.ok !== 'boolean' || response.ok !== true) {
            if (typeof response.description === 'string') {
                throw response.description;
            } else {
                throw 'Unknown error. Check debug log for more information.';
            }
        }
    }
};

try {
    var params = JSON.parse(value);

    if (typeof params.Token === 'undefined') {
        throw 'Incorrect value is given for parameter "Token": parameter is missing';
    }

    YandexMessenger.token = params.Token;

    if (params.HTTPProxy) {
        YandexMessenger.proxy = params.HTTPProxy;
    }

    params.ParseMode = params.ParseMode.toLowerCase();

    if (['markdown', 'html', 'markdownv2'].indexOf(params.ParseMode) !== -1) {
        YandexMessenger.parse_mode = params.ParseMode;
    }

    YandexMessenger.to = params.To;
    YandexMessenger.message = params.Subject + '\n' + params.Message;

    if (['markdown', 'html', 'markdownv2'].indexOf(params.ParseMode) !== -1) {
        YandexMessenger.message = YandexMessenger.escapeMarkup(YandexMessenger.message, params.ParseMode);
    }

    YandexMessenger.sendMessage();

    return 'OK';
} catch (error) {
    Zabbix.log(4, '[YandexMessenger Webhook] notification failed: ' + error);
    throw 'Sending failed: ' + error + '.';
}
