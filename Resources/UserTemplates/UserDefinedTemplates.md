# Add-Items: User defined templates

In this document, you will learn the fundamental concepts for building your own templates using the Add-Items extension.  
Make sure you have the [add items](https://marketplace.visualstudio.com/items?itemName=TheFish2191.add-items) extension installed and enabled on your `vscode` installation:

![extensionImage](Images/Extension_Add-Items.png)

Then, press `Ctrl+Shift+p` and start typing: `add-items: Open User templates file`, you will be prompted to create a new file, if you haven't created it already. Alternatively, you can try to add a new custom item using both the command palette or the context menu.

> **Note**  
> If you have already used this feature before, create a copy of your templates and then run the command `add-items: Restore User templates file`. Previous versions are not compatible!

![OpenUserTemplates](Images/OpenUserTemplates.gif)

There is already one entry created for you: the language TypeScript, with two templates: A class and a Enum.

But let's assume you want to create files for the language `C++`...

## Creating custom items

To simplify the process for you, we will use one of the two snippets to fast create a new language entry, this time for `C++`, delete the entry for JavaScript if you want, or feel free to edit it, add more items, or remove them... We will not use that in this very tutorial.

Just start typing `languageTemplate` in the new file, and press tab to auto-complete with the snipped (if you didn't deleted the javascript entry, add a comma at the end of the entry).

This is (part of) the snippet provided for you:

```JSON
"language": {
        "displayName": "Programming Language",
        "fileExt": ".txt",
        "description": "A shot description.",
        "templates": {
            "class": {
                "displayName": "class",
                "description": "A class template",
                "filename": "class",
                "body": [
                    "Line1",
                    "Line2",
                    "Line3",
                    "Line4"
                ]
            }
            ...
        }
    }
```

All the properties are necessary, and explained here:  
I recommend using camelCase notation

`language` => the programming language, `csharp`, `typeScript`,`python`...  
`displayName` => The name than will be shown in the input box (more about that latter)  
`fileExt` => The file extension for the new file that will be created  
`Description` => Is shown just below the `displayName`  
`templates` => The file templates than will be used to create new items.

Let's see how to fill all fields for a `Main` program for C++:

![languageEntry](Images/LanguageEntry.gif)

The templates property is quite important because it holds all the templates, in the previous example we added only one, but let's add another one:

- Add a comma at the end of the `main` obj and start typing `itemTemplate` as shown in the following gift

![itemTemplate](Images/itemTemplate.gif)

Any template has 4 properties:

`displayName` => Is show in a fancy way when creating a new item  
`description` => Is show just below the `displayName`  
`filename` => The name the new file will receive, regardless the file content.  
`body` => The snipped that will be used to fill the file.

The `body` is an array of `strings`, each string represent a new line in the new file. This is actually a `vs code` standard snippet. There is already a (great) official tutorial for that, and you can read it [right here]().

Give it a go, create your own snipped, and use it to create your own files!

## Create your file

Now see all in action by either running the command `add-items: Add Item (Custom)` or clicking the `Add item (Custom)` button in the explorer context menu, as follows:

![creatingCustomItem](Images/CustomItem.gif)

### C#, a special case

If you are a C# developer, you may be wondering: What about `namespaces`?

Well, don't you worry because I got your back:

Follow the process in the [Create custom items](#creating-custom-items) section, and use `[namespace]` in the exact part  of your snippet where you want to place the namespace, this is the class snipped I use to create a top level class, as an example:

```json
"class": {
    "displayName": "Class",
    "description": "A C# top level class.",
    "filename": "Class",
    "body": [
        "namespace [namespace];",
        "",
        "public class $TM_FILENAME_BASE",
        "{",
        "\t$0",
        "}"
    ]
}
```

The extension will replace the `[namespace]` string for an actual namespace, based on the projects, or the folder structure, when you create the file!
