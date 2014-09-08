//TODO: Show Leaderboard
//TODO: Save badge json to user model

var gamification = {};
gamification.server_url = "";
gamification.project_names = "geoq";
gamification.user_name = "";
gamification.proxy_url = "/geoq/proxy/";
gamification.$badge_container = null;
gamification.no_badges_message = "No badges yet";
gamification.maxBadgesToShow = 8;

gamification.init = function(options){
    gamification.server_url = options.server_url;
    if (options.project_names) gamification.project_names = options.project_names;
    gamification.user_name = options.user_name;
    gamification.$badge_container = options.$badge_container;
    if (typeof gamification.$badge_container == "string") {
        if (gamification.$badge_container.substr(0,1) != "#") {
            gamification.$badge_container = "#"+gamification.$badge_container;
        }
        gamification.$badge_container = $(gamification.$badge_container);
    }

    if (options.proxy_url) gamification.proxy_url = options.proxy_url;

    gamification.loadBadges();
};
gamification.proxify = function(url){
    url = gamification.proxy_url + encodeURI(url);
    return url.replace(/%253D/g,'%3D');
};
gamification.loadBadges = function(){

    //TODO: Work with multiple projects
    if ( gamification.$badge_container && gamification.user_name && gamification.server_url && gamification.project_names) {
        var badgeUrl = gamification.server_url + '/users/' + gamification.user_name + '/projects/' + gamification.project_names + '/badges?format=json';

        var url = gamification.proxify(badgeUrl);
        $.ajax({
            type: 'GET',
            url: url,
            dataType: 'json',
            timeout: 3000,
            success: gamification.badgeDataReturned,
            error: gamification.badgeDataError
        });
    } else {
        gamification.badgeDataError();
    }
};
gamification.badgeDataError = function() {
    if (gamification.$badge_container) {
        gamification.$badge_container.hide();
    }
};
gamification.badgeDataReturned = function (badge_info) {
    if (badge_info && badge_info.profile && badge_info.profile.length ) {

        var points = badge_info.points || 0;
        var badge_text = 'Badges: ';
        if (points) badge_text = 'Points: <b>'+points+'</b>, '+badge_text;

        var tags = [];
        var tagText = "";
        if (badge_info.tags) {
            for (var field in badge_info.tags) {
                tags.push({name:field, num:badge_info.tags[field]});
            }
            tags = _.sortBy(tags,"num");
            tags = tags.reverse();

            var tag_list = [];
            _.each(tags,function(tag){
                tag_list.push(tag.name);
            });
            tagText = "Tags: " + tag_list.join(", ");
        }

        var $title = $('<span>')
            .addClass('muted')
            .css({verticalAlign: 'super'})
            .html(badge_text)
            .appendTo(gamification.$badge_container);
        if (tagText) {
            $title.attr('title',tagText);
        }

        var allBadges = badge_info.profile;
        allBadges = _.sortBy(allBadges,function(b){return -b.count}); //Reverse count order

        var badgesToShow = _.first(allBadges,gamification.maxBadgesToShow); //Only grab the first 6

        _.each(badgesToShow,function(badge){
            var name = badge.projectbadge__name || "Badge";
            var count = badge.count || 1;
            var description = badge.projectbadge__description || "";
            var icon_url = badge.projectbadge__badge__icon || "";
            var project = badge.projectbadge__project__name || "";
            if (project) {
                description = "<b>"+_.str.titleize(project)+":</b> " + description;
            } else {
                project = gamification.project_names;
            }

            var image_url = encodeURI(icon_url);
            image_url = gamification.proxify(image_url);

            if (image_url) {
                description = "<img src='"+image_url+"' style='width:64px;float:left'/> "+description;
            }
            var $span = $('<span>')
                .attr({id:'badge_header_'+ _.str.dasherize(name), title:name})
                .addClass('badge_holder')
                .popover({
                    html:true,
                    title:name + " ("+count+")",
                    content:description,
                    trigger:'hover',
                    placement:'bottom'
                })
                .appendTo(gamification.$badge_container);

            var page_url = gamification.server_url+'/projects/'+project+'/';
            $('<img>')
                .attr({src:image_url})
                .click(function(){
                    window.open(page_url,'_blank');
                })
                .css({cursor:'pointer'})
                .appendTo($span);

            $('<span>')
                .text(count)
                .click(function(){
                    window.open(page_url,'_blank');
                })
                .css({cursor:'pointer'})
                .appendTo($span);
        });

        gamification.$badge_container.show();
    } else {
        gamification.$badge_container.append(gamification.no_badges_message);
    }
};