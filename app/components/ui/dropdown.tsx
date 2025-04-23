import { useEffect, useRef, useState } from 'react';
import classNames from 'classnames';
import useOutsideClick from "~/components/libs/useOutsideClick";
import { IconMatch } from "~/components/libs/icon"
import { getPlaceholderAvatarUrl } from "~/utils/placeholder"

interface DropdownItem {
  id: string;
  fullname: string;
  profilePicUrl?: string;
}

interface DropdownProps {
  id: string;
  title?: string;
  data: DropdownItem[];
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  hasImage?: boolean;
  className?: string;
  style?: string;
  selectedId?: string;
  onSelect?: (id: string) => void;
  defaultItem: {id: string, fullname: string, profilePicUrl: string};
}

export function Dropdown ({
  id,
  title = 'Select',
  data,
  position = 'bottom-left',
  hasImage,
  className,
  style,
  selectedId,
  onSelect,
  defaultItem,
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [selectedItem, setSelectedItem] = useState<DropdownItem | undefined>(
    selectedId ? data?.find((item) => item.id === selectedId) : undefined
  );

  const handleChange = (item: DropdownItem) => {
    setSelectedItem(item);
    onSelect && onSelect(item.id);
    setIsOpen(false);
  };

  useEffect(() => {
    if (selectedId && data.length) {
      if (selectedId == "0") {
        setSelectedItem({
          id: "0",
          fullname: "All client",
          profilePicUrl: "",
        });
      } else {
        const newSelectedItem = data.find((item) => item.id === selectedId);
        newSelectedItem && setSelectedItem(newSelectedItem);
      }
      
    } else {
      setSelectedItem(undefined);
    }
  }, [selectedId, data]);

  const dropdownRef = useRef<HTMLDivElement>(null);
  useOutsideClick({
    ref: dropdownRef,
    handler: () => setIsOpen(false),
  });

  const dropdownClass = classNames(
    'absolute bg-gray-100 w-full max-h-52 overflow-y-auto py-3 rounded shadow-md z-10 dark:bg-black ',
    {
      'top-full right-0 mt-2': position === 'bottom-right',
      'top-full left-0 mt-2': position === 'bottom-left',
      'bottom-full right-0 mb-2': position === 'top-right',
      'bottom-full left-0 mb-2': position === 'top-left',
    }
  );

  return (
    <div ref={dropdownRef} className='relative' >
      <button
        id={id}
        aria-label='Toggle dropdown'
        aria-haspopup='true'
        aria-expanded={isOpen}
        type='button'
        onClick={() => setIsOpen(!isOpen)}
        className={classNames(
          'flex items-center rounded w-full py-2 px-4 border-inherit rounded-md border border-gray-400',
          className
        )}
         
      >
        <img
          src={(selectedItem?.profilePicUrl || getPlaceholderAvatarUrl(selectedItem?.fullname))} 
          alt={selectedItem?.fullname}
          loading='lazy'
          className={`w-8 h-8 rounded-full bg-gray-400 object-cover me-2 ${ selectedItem?.profilePicUrl?.length > 0 ? '' : 'invisible'}`}
        />
        
        <span>{selectedItem?.fullname || title}</span>
        <span style={{marginLeft:"auto"}}>
          <IconMatch icon="caret-down"  
            className={classNames('transform duration-500 ease-in-out m-l-auto', {
              'rotate-180': isOpen,
            })}
          />
        </span>
      </button>

      {isOpen && (
        <div aria-label='Dropdown menu' className={dropdownClass}>
          <ul
            role='menu'
            aria-labelledby={id}
            aria-orientation='vertical'
            className='leading-10'
          >
            <li
                key="0"
                onClick={() => handleChange(defaultItem)}
                className={classNames(
                  'flex items-center cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-800 px-3',
                  { 'bg-gray-300': selectedItem?.id === defaultItem?.id }
                )}
                style={{marginLeft: "15px"}}
              >
                <span>--- {defaultItem.fullname} ---</span>
              </li>
            {data?.map((item) => (
              <li
                key={item.id}
                onClick={() => handleChange(item)}
                className={classNames(
                  'flex items-center cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-800 px-3',
                  { 'bg-gray-300': selectedItem?.id === item.id }
                )}
              >
                {hasImage && (
                  <img
                    src={(item?.profilePicUrl || getPlaceholderAvatarUrl(item?.fullname))} 
                    alt={item?.fullname}
                    loading='lazy'
                    className='w-8 h-8 rounded-full bg-gray-400 object-cover me-2'
                  />
                )}
                <span>{item?.fullname}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

// export default Dropdown;