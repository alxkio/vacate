
# NExt Up 

notes for what do do next, thoughts, plans etc. 


##### 2026-10-22

- Added vacation types, login / landing page with user and admin. 
- todo: settings page for org 
- todo: admin view changes/improvements 
    - what are the personas 
    - the admin should see primarily the org/department/team overview pages rather than his own leaves. His most often use case scenarios would be overviewing (admin could be HR personnel or owner)
    - view for approval requests, temporarily admin only can approve. 

- todo: post popular types: the leave types are way too many. I would like a shorter list with the most often ones that would be repeateable. maybe the list could expand with an action element (href/button?) and show all, but default limited view with the top types. 

- idea: expand mock data to actual personas in a company. add more people, use it company roles (focus in it sector initially is a thought), login for every user, cover scenarios of departments/teams and who sees what. 

- start mocking on how to add employees/remove, employee profile page with editable and not editable fiels (some would only be edited by admin, like hire date, prior years of work, family status/members (or we ll decide who changes what later)) 

- idea: ai chat, mcp and qna functionality in app (how many people of my org are leaving during christmass? other example q&a)

- todo: attach documents on leaves (example, paper from doctor/school after taking the leave)

- todo: notifications func. 

- what to focus on next: 

    - Structure a way of working: (way-of-working)
        - project folder (docs?) with jira item like md files that would act as our user stories. 
        - a product backlog file with all these stories (a one file)
        - a 'sprint' backlog 
        - a way of logging work time linked to our stories md files so we can trace time 
        - instructions for agents to follow the process and update these files when needed. 
        - evaluation/improvements in agentic context (agenst/skills/instructions)


    - agentic stuff and how they re triggered (wip)
    - finalise some base improvemnts and set 'mcp starting point' from the improved mock. The mock will help exploring scenarios, inspire for features, perfect base application functionalities. 
    Finalising the Mock would mean also ending up on a json schema for our user. 
    - start using branches and pr processes with agents 




    - end to end tests (maybe the last thing of mcp?)


##### 2026-10-25


1. User profile page, and user object definition 
2. org settings page / thinking about team page. 
3. improve my balances page 


## UI FEEDBACK

I want to remove the 3 choices and keep one.

colour wise, i prefer A. I want though the calendar of B to be a setting for the users to choose. I want the option the users to see
the whole organizations calendar. (for now, later we ll add settings and visibility rules chosen by the admin).

In the balances view, I want the sick leave to be further down in the page. If people are parents, apart from the annual I want them to see the parental like school, child care, parental, that can be more often. Maternity, paternity, voting, army to be further down.

From C, maybe we can keep the colour scheme as a setting also. with default being the one from A.

Converted to the accepted mock scope in [VAC-19](jira/VAC-19-calendar-display-preferences-and-balances.md); the prior A/B/C screenshots remain historical references.




## 2026-11-02

 - add country specific holidays (bank holidays) 
 - add organization closed dates 
 

## next
    ASVS - OWASP -> Agents/tests? 
    WCAG

    Unify ui into 2? and create UX 
    



- As a user I want to be able to add a leave request using the button and the form. In the form, i would have 2 ways of adding it: 
    - add the start date and the duration (preview amount)
    - add the start and end date, and when I do so I want the preview amount to adjust to the days (working days) I have selected (count them). 
    - when a weekend/public holiday falls within the dates I ve selected, I want it to be excluded from the calculation (and of cource from the amout to be registered in the db)
    - In the form I would like to be able to select the vacation type (as is for now) and choose the unit 
    - when the unit is hours, the date should be fixed (only one date selected, end date would be hidden). 
    (owner comment: since hours are not in scope yet lets disable the form from submission) 
    - when I have a low balance I want to get a  .warning  in the form. 