"""
A parser for simpsons.wikia.com dump file
"""
import sys
import mwparserfromhell
import json
from bs4 import BeautifulSoup as BS

characters = []
episodes = []
locations = []

month = {   'January':  '01',
            'February': '02',
            'March':    '03',
            'April':    '04',
            'May':      '05',
            'June':     '06',
            'July':     '07',
            'August':   '08',
            'September':'09',
            'October':  '10',
            'November': '11',
            'December': '12' }

def main():
    #soup = BS(open("test.xml", "r"), "xml")
    soup = BS(open("simpsons_pages_current.xml", "r"), "xml")
    pages = soup.find_all('page')
    for page in pages:
        if page.ns.text == '0':
            #print(page.title.text, file=sys.stderr) # print current page (useful when it crashes)
            wiki = mwparserfromhell.parse(page.text)
            if page.title.text == 'List of episodes':
                parse_eplist(page, wiki)
            else:
                temps = wiki.filter_templates(recursive=False)
                try:
                    for t in temps:
                        if t.name.matches('Character'):
                            parse_character(page, wiki, t)
                        elif t.name.matches('Location'):
                            parse_location(page, wiki, t)
                except:
                    print('Unknown error: '+ page.title.text, file=sys.stderr)

    ind = None #2
    sk = False #True
    print('var episodes = '+ json.dumps(episodes, indent=ind, sort_keys=sk) +';')
    print('var characters = '+ json.dumps(characters, indent=ind, sort_keys=sk) +';')
    print('var locations = '+ json.dumps(locations, indent=ind, sort_keys=sk) +';')


def isodate(dt):
    d = dt.split(' ')
    day = d[1].split(',')[0]
    if len(day) < 2:
        day = '0' + day
    return d[2] +'-'+ month[d[0]] +'-'+ day

def parse_eplist(page, wiki):
    s = 0
    eps = wiki.filter_templates(recursive=False, matches='^{{Eptable')
    for ep in eps:
        offset = 0
        if ep.name.matches('Eptablestart'): # Next season
            s += 1
            offset = -1
        e = {
            's': s,
            'e': int(ep.get(5+offset).value.strip_code()),
            'title': ep.get(2+offset).value.strip_code(),
            'airing': isodate(ep.get(3+offset).value.strip_code())
        }
        episodes.append(e)


def parse_location(page, wiki, location):
    l = {
        'location': page.title.text,
        'appearances': []
    }
    s = wiki.get_sections(matches='Appearances', include_headings=False)
    if s:
        if len(s[0].filter_wikilinks(matches='List of episodes')) > 0:
            l['appearances'] = 'ALL'
        else:
            temps = s[0].filter_templates(matches='^{{Ep')
            for t in temps:
                l['appearances'].append(t.get(1).value.strip_code())

    locations.append(l)


def strip_tags(node):
    return [n for n in node.nodes if not isinstance(n, mwparserfromhell.nodes.tag.Tag)]

def parse_character(page, wiki, character):
    t = character
    age = []
    if t.has('age'):
        for n in strip_tags(t.get('age').value):
            s = ''
            if isinstance(n, mwparserfromhell.nodes.text.Text):
                s = n.value.strip()
            elif isinstance(n, mwparserfromhell.nodes.wikilink.Wikilink):
                s = n.title.strip_code()
            elif isinstance(n, str):
                s = n.strip() # never occurs
            elif isinstance(n, mwparserfromhell.nodes.template.Template):
                try:
                    print("Error parsing age: "+ n.__unicode__())
                except:
                    pass
            else:
                print("Uncovered age case for "+ page.title.text, file=sys.stderr)
            if s:
                age.append(s)
    voiced = []
    vtmp = []
    if t.has('voiced by'):
        for n in t.get('voiced by').value.nodes:
            s = ''
            if isinstance(n, mwparserfromhell.nodes.text.Text):
                s = n.value.strip()
            elif isinstance(n, mwparserfromhell.nodes.tag.Tag):
                voiced.append(' '.join(vtmp))
                vtmp = []
                continue
            elif isinstance(n, mwparserfromhell.nodes.wikilink.Wikilink):
                s = n.title.strip_code()
            elif isinstance(n, mwparserfromhell.nodes.external_link.ExternalLink):
                s = n.title.strip_code()
            elif isinstance(n, str):
                s = n.strip() # never occurs
            else:
                try:
                    print("Error parsing voiced by: "+ n.__unicode__())
                except:
                    pass
            vtmp.append(s)
        if vtmp:
            voiced.append(' '.join(vtmp))

    img = t.has('image') and t.get('image').value.filter_wikilinks()
    if img:
        img = img[0].title.strip_code()
    c = {
        'page': page.title.text,
        'name': t.has('name') and t.get('name').value.strip_code() or page.title.text,
        'image': img,
        'gender': ((t.has('gender') and t.get('gender').value.matches("{{Male}}")) and "M" or "W"),
        'isAlive': t.has('status') and t.get('status').value.matches("{{Alive}}"),
        #'aliases': t.get('alias').value.split('<br />'),
        'age': age,
        'voicedBy': voiced,
        #'relatives': t.get('relatives').value,
        'appearances': []
    }
    s = wiki.get_sections(matches='Appearances', include_headings=False)
    if s:
        for t in s[0].filter_templates(matches='^{{Ep'):
            try:
                c['appearances'].append(t.get(1).value.strip_code())
            except:
                print("Wrong Ep template usage in "+ page.title.text, file=sys.stderr)

    if c['appearances']:
        # Only add characters with appearances in canonical episodes
        characters.append(c)


if __name__ == '__main__':
    main()
