"""
A simple parser for simpsons.wikia.com dump file that outputs JSON

Kudos to Earwig for creating mwparserfromhell
(https://github.com/earwig/mwparserfromhell)

The MIT License
Copyleft 2014 Andreas Brauchli <andreasb@hawaii.edu>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
"""

import sys
import mwparserfromhell
import json
import urllib
from bs4 import BeautifulSoup as BS
from datetime import date

characters = {}
voiceactors = {}
epidx = {} # dict for quicker lookups to replace episode -> episode index
episodes = []
locations = {}
images = []

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
    if (len(sys.argv) < 2):
        print("Missing file parameter", file=sys.stderr)
        return
    soup = BS(open(sys.argv[1], "r"), "xml")
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
    sk = True
    replace_appearances(characters, characters=True)
    replace_appearances(locations)
    character_coocurrance()
    print('var episodes = '+ json.dumps(episodes, indent=ind, sort_keys=sk) +';')
    print('var characters = '+ json.dumps(characters, indent=ind, sort_keys=sk) +';')
    print('var voiceactors = '+ json.dumps(voiceactors, indent=ind, sort_keys=sk) +';')
    print('var locations = '+ json.dumps(locations, indent=ind, sort_keys=sk) +';')
    print('var images = '+ json.dumps(resolve_images(), indent=ind, sort_keys=sk) +';')


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
        title = ep.get(2+offset).value.strip_code().strip()
        e = {
            's': s,
            'e': int(ep.get(5+offset).value.strip_code()),
            'title': title,
            'airing': isodate(ep.get(3+offset).value.strip_code().strip())
        }
        episodes.append(e)
        epidx[title.lower()] = len(episodes) -1 # caching to speed up replacement lookups


def parse_location(page, wiki, location):
    pagename = page.title.text
    img = location.has('image') and location.get('image').value.filter_wikilinks()
    if img:
        img = img[0].title.strip_code()
        images.append(img)

    l = {
        'page': pagename,
        'location': location.has('name') and location.get('name').value.strip_code().strip() or pagename,
        'image': img,
        'appearances': []
    }
    s = wiki.get_sections(matches='Appearances', include_headings=False)
    if s:
        if len(s[0].filter_wikilinks(matches='List of episodes')) > 0:
            l['appearances'] = 'ALL'
        else:
            temps = s[0].filter_templates(matches='^{{Ep')
            for t in temps:
                l['appearances'].append(t.get(1).value.strip_code().strip())

    locations[pagename] = l

def strip_tags(node):
    return [n for n in node.nodes if not isinstance(n, mwparserfromhell.nodes.tag.Tag)]

def parse_character(page, wiki, character):
    # ignore Category:Objects
    links = wiki.filter_wikilinks(recursive=False, matches="Category:")
    for l in links:
        if l.title.strip_code() == 'Category:Objects':
            return;
    pagename = page.title.text
    t = character
    age = []
    if t.has('age'):
        for n in strip_tags(t.get('age').value):
            s = ''
            if isinstance(n, mwparserfromhell.nodes.text.Text):
                s = n.value.strip()
            elif isinstance(n, mwparserfromhell.nodes.wikilink.Wikilink):
                s = n.title.strip_code().strip()
            elif isinstance(n, mwparserfromhell.nodes.template.Template):
                #{{Birthdate|1976|9|18}}
                if n.name.matches('Birthdate'):
                    d = date(int(n.get(1).value.strip_code()), int(n.get(2).value.strip_code()), int(n.get(3).value.strip_code()))
                    s = int((date.today() - d).days / 365)
                else:
                    try:
                        print("Error parsing age: "+ n.__unicode__() +" in "+ pagename, file=sys.stderr)
                    except:
                        pass
            else:
                print("Uncovered age case for "+ pagename, file=sys.stderr)
            if s:
                age.append(s)
    voiced = []
    vtmp = []
    if t.has('voiced by'):
        for n in t.get('voiced by').value.nodes:
            s = ''
            if isinstance(n, mwparserfromhell.nodes.text.Text):
                s = n.value.strip(' ,\r\n\t')
            elif isinstance(n, mwparserfromhell.nodes.tag.Tag):
                voiced.append(' '.join(vtmp))
                vtmp = []
                continue
            elif isinstance(n, mwparserfromhell.nodes.wikilink.Wikilink):
                s = n.title.strip_code().strip()
            elif isinstance(n, mwparserfromhell.nodes.external_link.ExternalLink):
                s = n.title.strip_code().strip()
            else:
                try:
                    print("Error parsing voiced by: "+ n.__unicode__() +" in "+ pagename, file=sys.stderr)
                except:
                    pass
            if s:
                if s[0] != '(' and s not in [
                    'none', 'N/A', '"', 'No one (Nonspeaking in the series)',
                    'No Voice', ' ', 'in "', '&', 'and', 'uknown', 'Unknow',
                    'and this Unknown or None', '?', '&nbsp;', 'Status=', ')',
                    'Various', 'nome', 'unknown', 'Probably', 'Nobody', '\u00a0'
                ]:
                    if s[0:10] == 'wikipedia:':
                        s = s[10:]
                    vtmp.append(s)
        if vtmp:
            for v in vtmp:
                if v not in voiceactors:
                    voiceactors[v] = []
                voiceactors[v].append(pagename)
            voiced.append(' '.join(vtmp))

    img = t.has('image') and t.get('image').value.filter_wikilinks()
    if img:
        img = img[0].title.strip_code()
        images.append(img)
    else:
        img = False

    gender = '?'
    if t.has('gender'):
        gen = t.get('gender').value.lower()
        if "female" in gen:
            gender = 'F'
        elif "male" in gen:
            gender = 'M'

    c = {
        'page': pagename,
        'name': t.has('name') and t.get('name').value.strip_code().strip() or pagename,
        'image': img,
        'gender': gender,
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
                c['appearances'].append(t.get(1).value.strip_code().strip())
            except:
                print("Wrong Ep template usage in "+ pagename, file=sys.stderr)

    if c['appearances'] or pagename == 'Homer Simpson':
        # Only add characters with appearances in canonical episodes
        characters[pagename] = c
    else:
        print("No appearances in "+ pagename, file=sys.stderr)


def replace_appearances(dic, characters = False):
    delkeys = []
    for k in dic.keys():
        v = dic[k]
        ap = v['appearances']
        for i, title in enumerate(ap):
            t = title.lower()
            if t in epidx:
                ap[i] = epidx[t]
            else:
                # remove link
                del ap[i]
                if title not in [
                    'Day Of The Nerd',
                    'Days of Future Future',
                    'Do the Bartman', # A song, not an episode
                    'Enter the Cheatrix',
                    'The Aquarium',
                    'The Longest Daycare',
                    'The Pagans',
                    'The Simpsons Movie']:
                    print("Unknown episode "+ title, file=sys.stderr);
        if not ap:
            delkeys.append(k)

    if characters:
        # Special case for Homer Simpson which appears in all episodes but doesn't
        # have an appearances list
        if 'Homer Simpson' in dic:
            dic['Homer Simpson']['appearances'] = list(range(len(episodes)))

        # Special case for Maggie Simpson whose appearance list is reversed (where she doesn't appear)
        if 'Maggie Simpson' in dic:
            ap = dic['Maggie Simpson']['appearances']
            dic['Maggie Simpson']['appearances'] = [i for i in range(len(episodes)) if i not in ap]

    # remove items with no appearances
    print('Removing charaters/locations beacause of non-canon appearances:', file=sys.stderr)
    for k in delkeys:
        if k != 'Homer Simpson':
            print('\t'+ k, file=sys.stderr)
            del dic[k]


def character_coocurrance():
    ep = {} # character (indices) per episode
    chars = [k for k in characters.keys()] # build character indices from dict keys
    for i, c in enumerate(chars):
        for a in characters[c]['appearances']:
            if a in ep:
                ep[a].append(i)
            else:
                ep[a] = [i]

    n = len(chars)
    cooc = [[[] for j in range(n)] for i in range(n)] # nxn matrix
    for episode in ep.keys():
        for character1 in ep[episode]:
            for character2 in ep[episode]:
                if not character1 == character2:
                    cooc[character1][character2].append(episode)
    sorted_cooc = [None]*n
    for cidx, c in enumerate(cooc):
        # sorted co-occurance as (char, # co-occurances) items
        # only characters with > 0 co-occurances listed
        characters[chars[cidx]]['cooc'] = [[chars[i[0]], len(i[1]), i[1]] for i in sorted(enumerate(c), key=lambda x: len(x[1]), reverse=True) if i[1]]


def resolve_images():
    res_img = {}
    print("Fetching %d images" % len(images), file=sys.stderr)
    while len(images):
        img = []
        while len(img) < 50 and len(images):
            img.append(images.pop())

        url = 'http://simpsons.wikia.com/api.php?action=query&titles='+ urllib.parse.quote('|'.join(img)) +'&prop=imageinfo&iiprop=url&format=json'
        if len(url) > 2000:
            print("Warning long URL: %d" % len(url), file=sys.stderr)
        site = urllib.request.urlopen(url).read()
        j = json.loads(site.decode())
        for i in j['query']['pages'].items():
            try:
                if int(i[0]) < 0 and i[1].__contains__('missing'):
                    print("Error: missing image "+ i[1]['title'], file=sys.stderr)
                else:
                    title = i[1]['title']
                    url = i[1]['imageinfo'][0]['url']
                    res_img[title] = url
                    # Retrieve images
                    # urllib.request.urlretrieve(url, 'images/'+ title[5:])
            except:
                if i[1] and i[1].__contains__('title'):
                    print("Error parsing image '%s'" % i[1]['title'], file=sys.stderr)
                else:
                    print("Error parsing image", file=sys.stderr)
    return res_img

if __name__ == '__main__':
    main()
